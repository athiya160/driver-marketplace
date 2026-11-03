/**
 * PERSONAL DRIVER MARKETPLACE - DECOUPLED NOTIFICATION DISPATCHER
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Delivers multi-channel notifications (In-App SSE + SMS) without blocking or corrupting core booking state.
 */

import { globalSmsService } from './smsService.js';
import { globalRealtimeBus } from '../marketplace/realtimeEventBus.js';
import { persistentStorage } from '../db/persistentStorage.js';

export class NotificationService {
  constructor(sms = globalSmsService, realtime = globalRealtimeBus) {
    this.sms = sms;
    this.realtime = realtime;
  }

  /**
   * Dispatches multi-channel notification safely with try/catch isolation
   */
  async notify({
    userId,
    phone,
    channel,
    eventType,
    title,
    message,
    metadata = {},
    sendSms = false,
    smsHandler = null
  }) {
    // 1. Deliver real-time in-app event
    if (channel) {
      try {
        this.realtime.publish(channel, eventType, {
          title,
          message,
          ...metadata,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn(`Realtime notification failed for channel ${channel}:`, err.message);
      }
    }

    // 2. Deliver SMS if enabled and configured (safe async try/catch)
    let smsResult = null;
    if (sendSms && phone && smsHandler) {
      try {
        smsResult = await smsHandler();
      } catch (err) {
        // Safe Failure: SMS delivery errors are logged but never crash booking transactions
        console.warn(`Transactional SMS delivery failed for ${phone}:`, err.message);
        smsResult = { success: false, error: err.message };
      }
    }

    // 3. Log notification in persistent store
    const notifications = persistentStorage.getTable('notifications') || [];
    notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      phone,
      eventType,
      title,
      message,
      smsDelivered: Boolean(smsResult?.success),
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      deliveredInApp: Boolean(channel),
      smsResult
    };
  }

  async notifyBookingConfirmed(booking, customer) {
    return this.notify({
      userId: customer?.id || booking.customerId,
      phone: customer?.phone || booking.customerPhone,
      channel: `customer:booking:${booking.id}`,
      eventType: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `Your driver booking for ${booking.serviceTitle} has been confirmed. Finding your chauffeur now.`,
      metadata: { bookingReference: booking.bookingReference },
      sendSms: true,
      smsHandler: () => this.sms.sendBookingConfirmedSms(
        customer?.phone || booking.customerPhone,
        booking.bookingReference,
        booking.serviceTitle,
        booking.pickupCity
      )
    });
  }

  async notifyRefundProcessed(booking, refundAmount, refundId) {
    return this.notify({
      userId: booking.customerId,
      phone: booking.customerPhone,
      channel: `customer:booking:${booking.id}`,
      eventType: 'REFUND_PROCESSED',
      title: 'Refund Processed',
      message: `Refund of ₹${refundAmount} has been processed via Razorpay.`,
      metadata: { refundId, amount: refundAmount },
      sendSms: true,
      smsHandler: () => this.sms.sendRefundInitiatedSms(
        booking.customerPhone,
        booking.bookingReference,
        refundAmount,
        refundId
      )
    });
  }
}

export const globalNotificationService = new NotificationService();
