/**
 * PERSONAL DRIVER MARKETPLACE - CLI DATABASE BACKUP & RESTORE UTILITY
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 */

import { globalDisasterRecovery } from '../server/infrastructure/disasterRecovery.js';

async function main() {
  const action = process.argv[2] || 'backup';

  if (action === 'backup') {
    console.log('📦 Initiating database backup...');
    const result = await globalDisasterRecovery.createBackup('cli_manual_trigger');
    if (result.success) {
      console.log(`✅ Backup created successfully!`);
      console.log(`ID: ${result.backupId}`);
      console.log(`File: ${result.path}`);
      console.log(`Checksum (SHA-256): ${result.metadata.checksum}`);
    } else {
      console.error(`❌ Backup failed: ${result.error}`);
      process.exit(1);
    }
  } else if (action === 'verify') {
    const backupId = process.argv[3];
    if (!backupId) {
      console.error('Usage: node scripts/backup_database.js verify <backupIdOrPath>');
      process.exit(1);
    }
    const result = globalDisasterRecovery.verifyBackupIntegrity(backupId);
    if (result.valid) {
      console.log(`✅ Backup integrity verified: ${backupId}`);
      console.log(`Tables: ${result.tableCount}`);
    } else {
      console.error(`❌ Backup verification failed: ${result.error}`);
      process.exit(1);
    }
  } else if (action === 'restore') {
    const backupId = process.argv[3];
    if (!backupId) {
      console.error('Usage: node scripts/backup_database.js restore <backupIdOrPath>');
      process.exit(1);
    }
    console.log(`⚠️ Restoring from backup: ${backupId}...`);
    const result = await globalDisasterRecovery.restoreBackup(backupId, 'cli_manual_restore');
    if (result.success) {
      console.log(`✅ Database successfully restored to backup: ${result.restoredBackupId}`);
      console.log(`Safety snapshot created: ${result.safetyBackupId}`);
    } else {
      console.error(`❌ Restore failed: ${result.error}`);
      process.exit(1);
    }
  } else {
    console.log('Usage: node scripts/backup_database.js [backup|verify|restore] <target>');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
