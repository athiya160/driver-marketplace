/**
 * PERSONAL DRIVER MARKETPLACE - RAZORPAY WEBHOOK PROCESSING SERVICE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Verifies raw body HMAC SHA-256 signatures, deduplicates event IDs,
 * and asynchronously reconciles payments, refunds, and order states.
 */

import { globalRazorpayClient } from './razorpayClient.js';
import { persistentStorage } from '../db/persistentStorage.js';
import { globalRealtimeBus } from '../marketplace/realtimeEventBus.js';

export class WebhookService {
  constructor(client = globalRazorpayClient) {
    this.razorpay = client;
  }

  /**
   * Processes incoming Razorpay Webhook with signature verification and deduplication
   */
  async processWebhook({ rawBody, signature, eventId: headerEventId }) {
    // 1. Verify Webhook Signature using raw body
    const sigCheck = this.razorpay.verifyWebhookSignature({ rawBody, signature });
    if (!sigCheck.valid) {
      return {
        statusCode: 400,
        result: { success: false, code: 'INVALID_SIGNATURE', message: sigCheck.reason }
      };
    }

    const eventPayload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = headerEventId || eventPayload.id || `evt_${Date.now()}`;
    const eventType = eventPayload.event;

    // 2. Deduplicate repeated webhook events
    const processedWebhooks = persistentStorage.getTable('processed_webhook_events');
    const existing = processedWebhooks.find(e => e.eventId === eventId);
    if (existing) {
      return {
        statusCode: 200,
        result: {
          success: true,
          alreadyProcessed: true,
          message: `Webhook event ${eventId} already processed previously. Idempotent skip.`
        }
      };
    }

    // 3. Dispatch specific event handlers
    let processingNotes = '';

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;
          const amountPaise = paymentEntity.amount;

          const payments = persistentStorage.getTable('payments');
          let payment = payments.find(p => p.razorpayOrderId === orderId || p.razorpayPaymentId === paymentId);
          if (payment) {
            payment.status = 'captured';
            payment.razorpayPaymentId = paymentId;
            payment.capturedAt = new Date().toISOString();
          } else {
            payment = persistentStorage.insert('payments', {
              id: `pay_${Date.now()}`,
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              amountPaise,
              currency: paymentEntity.currency || 'INR',
              status: 'captured',
              capturedAt: new Date().toISOString()
            });
          }

          // Reconcile booking if present
          const bookingId = paymentEntity.notes?.bookingId || payment?.bookingId;
          if (bookingId) {
            const bookings = persistentStorage.getTable('bookings');
            const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
            if (booking) {
              booking.paymentStatus = 'captured';
              booking.capturedAt = new Date().toISOString();
            }

            globalRealtimeBus.publish(`customer:booking:${bookingId}`, 'PAYMENT_CAPTURED', {
              bookingId,
              paymentId,
              amountPaise,
              status: 'captured'
            });
          }

          processingNotes = `Payment ${paymentId} captured (${amountPaise} paise)`;
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;

          const payments = persistentStorage.getTable('payments');
          const payment = payments.find(p => p.razorpayOrderId === orderId);
          if (payment) {
            payment.status = 'failed';
            payment.errorCode = paymentEntity.error_code;
            payment.errorDescription = paymentEntity.error_description;
          }

          processingNotes = `Payment ${paymentId} marked failed: ${paymentEntity.error_description}`;
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = eventPayload.payload?.refund?.entity;
        if (refundEntity) {
          const refundId = refundEntity.id;
          const refunds = persistentStorage.getTable('payment_refunds');
          const refund = refunds.find(r => r.razorpayRefundId === refundId);
          if (refund) {
            refund.status = 'processed';
            refund.processedAt = new Date().toISOString();
          }
          processingNotes = `Refund ${refundId} marked processed`;
        }
        break;
      }

      case 'refund.failed': {
        const refundEntity = eventPayload.payload?.refund?.entity;
        if (refundEntity) {
          const refundId = refundEntity.id;
          const refunds = persistentStorage.getTable('payment_refunds');
          const refund = refunds.find(r => r.razorpayRefundId === refundId);
          if (refund) {
            refund.status = 'failed';
          }
          processingNotes = `Refund ${refundId} marked failed`;
        }
        break;
      }

      default: {
        processingNotes = `Acknowledged unhandled event type: ${eventType}`;
        break;
      }
    }

    // 4. Mark event ID processed in store
    processedWebhooks.push({
      eventId,
      eventType,
      source: 'razorpay',
      notes: processingNotes,
      processedAt: new Date().toISOString()
    });

    persistentStorage.persist();

    return {
      statusCode: 200,
      result: {
        success: true,
        eventId,
        eventType,
        notes: processingNotes
      }
    };
  }
}

export const globalWebhookService = new WebhookService();
