/**
 * PERSONAL DRIVER MARKETPLACE - DURABLE DISPATCH BACKGROUND WORKER
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Guarantees fault-tolerant dispatch timeout execution across process restarts.
 * Periodically scans distributed state for expired offers and automatically escalates
 * cascade assignments without depending on ephemeral client browser timers.
 */

import { globalRedisClient } from './redisClient.js';
import { globalRealtimeBus } from '../marketplace/realtimeEventBus.js';
import { persistentStorage } from '../db/persistentStorage.js';

export class DurableDispatchWorker {
  constructor(redis = globalRedisClient, eventBus = globalRealtimeBus) {
    this.redis = redis;
    this.eventBus = eventBus;
    this.intervalId = null;
    this.isRunning = false;
    this.checkIntervalMs = 2000; // Check every 2 seconds
    this.processedTimeouts = new Set();
  }

  /**
   * Starts the background durable watchdog timer
   */
  startWorker(intervalMs = 2000) {
    if (this.isRunning) return;
    this.checkIntervalMs = intervalMs;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick().catch(err => {
        console.warn('Durable dispatch worker tick error:', err.message);
      });
    }, this.checkIntervalMs);
  }

  /**
   * Stops the background worker cleanly (for graceful shutdown & test teardown)
   */
  stopWorker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Execution cycle: queries active dispatch sessions and processes timeouts
   */
  async tick() {
    const activeSessions = await this.redis.listActiveDispatchSessions();
    const now = Date.now();

    for (const session of activeSessions) {
      // Check if session has timed out
      if (session.expiresAt && now >= session.expiresAt && session.status === 'offered') {
        const timeoutKey = `${session.bookingId}:${session.currentCandidateIndex}:${session.expiresAt}`;
        if (this.processedTimeouts.has(timeoutKey)) continue;
        this.processedTimeouts.add(timeoutKey);

        await this.handleOfferTimeout(session);
      }
    }
  }

  /**
   * Escalates an expired offer to the next driver in the cascade
   */
  async handleOfferTimeout(session) {
    const { bookingId, candidates = [], currentCandidateIndex = 0 } = session;
    const nextIndex = currentCandidateIndex + 1;

    // Acquire lock to guarantee single worker execution
    const lock = await this.redis.acquireLock(`dispatch_escalate:${bookingId}`, 15);
    if (!lock.acquired) return; // Another worker is escalating

    try {
      if (nextIndex < candidates.length) {
        // Escalate to next candidate
        const nextDriver = candidates[nextIndex];
        const newExpiresAt = Date.now() + 45 * 1000; // 45 seconds offer window

        session.currentCandidateIndex = nextIndex;
        session.currentDriverId = nextDriver.id;
        session.offeredAt = new Date().toISOString();
        session.expiresAt = newExpiresAt;
        session.status = 'offered';

        await this.redis.saveDispatchSession(bookingId, session);

        // Broadcast to next driver channel
        this.eventBus.publish(`driver:${nextDriver.id}`, 'DISPATCH_PROPOSAL', {
          bookingId,
          expiresInSeconds: 45,
          expiresAt: new Date(newExpiresAt).toISOString(),
          escalationRound: nextIndex + 1
        });

        // Notify customer dispatch is trying next candidate
        this.eventBus.publish(`customer:booking:${bookingId}`, 'DISPATCH_ESCALATING', {
          bookingId,
          attemptNumber: nextIndex + 1,
          message: 'Matching with next verified nearby chauffeur...'
        });
      } else {
        // All candidates exhausted
        session.status = 'exhausted_no_driver';
        await this.redis.saveDispatchSession(bookingId, session);

        // Update persistent booking if present
        const bookings = persistentStorage.getTable('bookings');
        const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
        if (booking && booking.status === 'dispatched') {
          booking.status = 'no_driver_available';
          persistentStorage.persist();
        }

        this.eventBus.publish(`customer:booking:${bookingId}`, 'DISPATCH_TIMEOUT', {
          bookingId,
          message: 'No chauffeurs responded in your area. You can retry with a higher priority bonus or change pickup time.'
        });

        this.eventBus.publish('admin:operations', 'DISPATCH_FAILED', {
          bookingId,
          reason: 'All candidates timed out'
        });
      }
    } finally {
      await this.redis.releaseLock(`dispatch_escalate:${bookingId}`, lock.token);
    }
  }

  /**
   * Recovers and re-seeds active dispatch sessions from persistent store upon server startup
   */
  async recoverActiveSessionsOnStartup() {
    const bookings = persistentStorage.getTable('bookings') || [];
    const activeDispatched = bookings.filter(b => b.status === 'dispatched');

    for (const b of activeDispatched) {
      const existing = await this.redis.getDispatchSession(b.id);
      if (!existing) {
        // Recover session
        await this.redis.saveDispatchSession(b.id, {
          bookingId: b.id,
          bookingReference: b.bookingReference,
          status: 'offered',
          currentCandidateIndex: 0,
          currentDriverId: b.driverId || 'drv_default',
          candidates: [{ id: b.driverId || 'drv_default' }],
          expiresAt: Date.now() + 30 * 1000 // Give 30s recovery buffer
        });
      }
    }

    return {
      recoveredCount: activeDispatched.length,
      timestamp: new Date().toISOString()
    };
  }
}

export const globalDurableDispatchWorker = new DurableDispatchWorker();
