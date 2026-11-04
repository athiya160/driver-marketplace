/**
 * PERSONAL DRIVER MARKETPLACE - DISASTER RECOVERY & RESILIENCE ENGINE (PHASE 8G)
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Capabilities:
 * 1. Automated database snapshots and backups with SHA-256 cryptographic verification
 * 2. Safe point-in-time restore procedure with pre-restore validation and rollback guard
 * 3. Server boot recovery: restores durable dispatch sessions, cleans stale locks, and reconciles pending bookings
 * 4. Redis reconnection resilience with exponential backoff diagnostics
 * 5. Structured health telemetry for staging and production orchestrators
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { persistentStorage } from '../db/persistentStorage.js';
import { globalRedisClient } from './redisClient.js';
import { globalDurableDispatchWorker } from './durableDispatchWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BACKUP_DIR = path.resolve(__dirname, '../db/backups');

export class DisasterRecoveryEngine {
  constructor(options = {}) {
    this.backupDir = options.backupDir || BACKUP_DIR;
    this.ensureBackupDirectory();
  }

  /**
   * Ensures the backup storage directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch (err) {
        // Fallback for sandboxed or read-only environments
      }
    }
  }

  /**
   * Computes SHA-256 checksum of string or buffer
   */
  computeChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Creates a timestamped, cryptographically hashed database backup
   */
  async createBackup(initiatedBy = 'system_scheduled_backup') {
    this.ensureBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;
    const filename = `${backupId}.json`;
    const targetPath = path.join(this.backupDir, filename);

    // Retrieve full snapshot from persistent storage
    const state = persistentStorage.state || {};
    const rawData = JSON.stringify(state, null, 2);
    const checksum = this.computeChecksum(rawData);

    const backupMetadata = {
      backupId,
      filename,
      timestamp: new Date().toISOString(),
      initiatedBy,
      checksum,
      tableCount: Object.keys(state).length,
      recordCounts: {
        users: (state.users || []).length,
        drivers: (state.drivers || []).length,
        bookings: (state.bookings || []).length,
        financial_transactions: (state.financial_transactions || []).length,
        admin_audit_logs: (state.admin_audit_logs || []).length
      },
      environment: process.env.NODE_ENV || 'staging'
    };

    const backupEnvelope = {
      metadata: backupMetadata,
      payload: state
    };

    try {
      fs.writeFileSync(targetPath, JSON.stringify(backupEnvelope, null, 2), 'utf8');
    } catch (err) {
      // In constrained environments where disk writing to ../db/backups fails
      return {
        success: false,
        backupId,
        error: err.message,
        metadata: backupMetadata
      };
    }

    return {
      success: true,
      backupId,
      path: targetPath,
      metadata: backupMetadata
    };
  }

  /**
   * Verifies the cryptographic integrity and structure of a backup file
   */
  verifyBackupIntegrity(backupIdOrPath) {
    let filePath = backupIdOrPath;
    if (!fs.existsSync(filePath)) {
      filePath = path.join(this.backupDir, `${backupIdOrPath}.json`);
    }

    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: `Backup file not found at ${filePath}`
      };
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);

      if (!parsed.metadata || !parsed.payload) {
        return { valid: false, error: 'Malformed backup envelope: missing metadata or payload' };
      }

      // Verify SHA-256 payload checksum
      const rawPayload = JSON.stringify(parsed.payload, null, 2);
      const computedChecksum = this.computeChecksum(rawPayload);

      if (parsed.metadata.checksum && parsed.metadata.checksum !== computedChecksum) {
        return {
          valid: false,
          error: `Checksum mismatch: expected ${parsed.metadata.checksum}, calculated ${computedChecksum}`
        };
      }

      // Verify core required tables
      const requiredTables = ['users', 'drivers', 'bookings', 'admin_audit_logs'];
      for (const table of requiredTables) {
        if (!Array.isArray(parsed.payload[table])) {
          return { valid: false, error: `Corrupt backup payload: table ${table} is missing or not an array` };
        }
      }

      return {
        valid: true,
        backupId: parsed.metadata.backupId,
        metadata: parsed.metadata,
        tableCount: Object.keys(parsed.payload).length
      };
    } catch (err) {
      return {
        valid: false,
        error: `Failed to parse backup file: ${err.message}`
      };
    }
  }

  /**
   * Restores database state from a validated backup file
   */
  async restoreBackup(backupIdOrPath, restoredBy = 'system_recovery') {
    const verification = this.verifyBackupIntegrity(backupIdOrPath);
    if (!verification.valid) {
      return {
        success: false,
        error: `Pre-restore validation failed: ${verification.error}`
      };
    }

    let filePath = backupIdOrPath;
    if (!fs.existsSync(filePath)) {
      filePath = path.join(this.backupDir, `${backupIdOrPath}.json`);
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);

      // Perform pre-restore safety snapshot of current data before overwriting
      const safetyBackup = await this.createBackup(`pre_restore_safety_${verification.backupId}`);

      // Apply payload to persistent storage
      persistentStorage.state = parsed.payload;
      persistentStorage.persist();

      // Record administrative audit log
      if (Array.isArray(persistentStorage.state.admin_audit_logs)) {
        persistentStorage.state.admin_audit_logs.unshift({
          id: `log_restore_${Date.now()}`,
          adminName: restoredBy,
          action: 'DISASTER_RECOVERY_DATABASE_RESTORE',
          target: verification.backupId,
          details: `Database restored from backup ${verification.backupId}. Pre-restore snapshot created: ${safetyBackup.backupId}`,
          timestamp: new Date().toISOString()
        });
        persistentStorage.persist();
      }

      return {
        success: true,
        restoredBackupId: verification.backupId,
        safetyBackupId: safetyBackup.backupId,
        restoredAt: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: `Restore execution failed: ${err.message}`
      };
    }
  }

  /**
   * Recovers server state on startup / reboot:
   * 1. Reconnects Redis state
   * 2. Recovers durable dispatch sessions into distributed state
   * 3. Cleans stale locks and expired windows
   * 4. Reconciles expired bookings
   */
  async recoverServerStateOnBoot() {
    const recoveryReport = {
      timestamp: new Date().toISOString(),
      redisStatus: 'probed',
      recoveredSessionsCount: 0,
      clearedStaleLocksCount: 0,
      reconciledBookingsCount: 0,
      errors: []
    };

    try {
      // 1. Probe Redis connection
      const ping = await globalRedisClient.ping();
      recoveryReport.redisMode = ping.mode;

      // 2. Clear stale expired locks in distributed state
      const now = Date.now();
      for (const [key, lock] of globalRedisClient.activeLocks.entries()) {
        if (lock.expiresAt && lock.expiresAt < now) {
          globalRedisClient.activeLocks.delete(key);
          recoveryReport.clearedStaleLocksCount++;
        }
      }

      // 3. Recover persistent dispatch sessions
      const persistentSessions = persistentStorage.getTable('dispatch_sessions') || [];
      for (const session of persistentSessions) {
        if (session.status === 'dispatched' && session.expiresAt && new Date(session.expiresAt).getTime() > now) {
          await globalRedisClient.saveDispatchSession(session.bookingId, session);
          recoveryReport.recoveredSessionsCount++;
        }
      }

      // 4. Reconcile timed-out dispatch offers
      const sweep = await globalDurableDispatchWorker.recoverActiveSessionsOnStartup();
      recoveryReport.reconciledBookingsCount = sweep.recoveredCount;

    } catch (err) {
      recoveryReport.errors.push(err.message);
    }

    return recoveryReport;
  }
}

export const globalDisasterRecovery = new DisasterRecoveryEngine();
