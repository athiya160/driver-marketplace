/**
 * PERSONAL DRIVER MARKETPLACE - REFUND MANAGEMENT SERVICE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Supports full refunds, partial refunds, cancellation refunds & administrative disputes.
 * Validates refundable balance and preserves complete financial audit trails.
 */

import { globalRazorpayClient } from './razorpayClient.js';
import { validatePaiseAmount, formatINR } from './paymentValidation.js';
import { persistentStorage } from '../db/persistentStorage.js';
import { globalRealtimeBus } from '../marketplace/realtimeEventBus.js';

export class RefundService {
  constructor(client = globalRazorpayClient) {
    this.razorpay = client;
    this.inFlightLocks = new Set(); // Concurrency lock per paymentId
  }

  /**
   * Processes a verified refund on an existing captured payment
   */
  async processRefund({
    paymentId,
    bookingId,
    amountPaise,
    reason,
    initiatingAdmin = 'Operations Admin',
    speed = 'normal'
  }) {
    if (!paymentId && !bookingId) {
      throw new Error('Either paymentId or bookingId is required to process refund');
    }

    const payments = persistentStorage.getTable('payments');
    let payment = payments.find(p => p.id === paymentId || p.razorpayPaymentId === paymentId || p.bookingId === bookingId);

    if (!payment && bookingId) {
      const bookings = persistentStorage.getTable('bookings');
      const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
      if (booking && (booking.paymentStatus === 'captured' || booking.paymentStatus === 'paid')) {
        payment = {
          id: `pay_auto_${booking.id}`,
          bookingId: booking.id,
          razorpayPaymentId: `pay_rzp_mock_${booking.id}`,
          orderId: `order_mock_${booking.id}`,
          amountPaise: Math.round((Number(booking.totalFare) || 599) * 100),
          currency: 'INR',
          status: 'captured',
          isTestMode: true,
          createdAt: booking.createdAt || new Date().toISOString()
        };
        persistentStorage.insert('payments', payment);
      }
    }

    if (!payment) {
      return { success: false, code: 'PAYMENT_NOT_FOUND', message: 'Original payment record not found' };
    }

    // Concurrency Lock: Prevent simultaneous double-refund submissions on the same payment
    if (this.inFlightLocks.has(payment.id)) {
      return {
        success: false,
        code: 'CONCURRENT_REFUND_IN_PROGRESS',
        message: 'A refund is currently being processed for this payment. Please wait.'
      };
    }
    this.inFlightLocks.add(payment.id);

    try {
      if (!['captured', 'partially_refunded'].includes(payment.status)) {
        return {
          success: false,
          code: 'INVALID_PAYMENT_STATE',
          message: `Cannot refund payment in status '${payment.status}'. Only captured payments can be refunded.`
        };
      }

    // 1. Calculate previously refunded total
    const refunds = persistentStorage.getTable('payment_refunds');
    const existingRefunds = refunds.filter(r => r.paymentId === payment.id && r.status === 'processed');
    const previouslyRefundedPaise = existingRefunds.reduce((acc, curr) => acc + (curr.amountPaise || 0), 0);
    const refundableBalancePaise = payment.amountPaise - previouslyRefundedPaise;

    // Determine target refund amount
    const targetRefundPaise = amountPaise || refundableBalancePaise;

    const valCheck = validatePaiseAmount(targetRefundPaise, 'Refund Amount');
    if (!valCheck.valid) {
      return { success: false, code: 'INVALID_AMOUNT', message: valCheck.message };
    }

    // 2. Prevent refund exceeding captured amount
    if (targetRefundPaise > refundableBalancePaise) {
      return {
        success: false,
        code: 'REFUND_EXCEEDS_BALANCE',
        message: `Requested refund (${formatINR(targetRefundPaise)}) exceeds available refundable balance (${formatINR(refundableBalancePaise)}).`
      };
    }

    // 3. Execute refund via Razorpay API in TEST MODE
    const receipt = `rcpt_rf_${payment.id}_${Date.now()}`;
    const rzpRefund = await this.razorpay.createRefund(payment.razorpayPaymentId || `pay_rzp_mock_${payment.id}`, {
      amount: targetRefundPaise,
      speed,
      receipt,
      notes: {
        bookingId: payment.bookingId,
        reason: reason || 'Customer requested refund',
        initiatingAdmin
      }
    });

    // 4. Record refund in payment_refunds table
    const refundRecord = {
      id: `rf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      razorpayRefundId: rzpRefund.id,
      amountPaise: targetRefundPaise,
      currency: 'INR',
      status: rzpRefund.status === 'processed' ? 'processed' : 'processing',
      reason: reason || 'Customer requested refund / trip cancellation',
      initiatedBy: initiatingAdmin,
      isTestMode: this.razorpay.isTestMode,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    persistentStorage.insert('payment_refunds', refundRecord);

    // 5. Update payment status (partially_refunded vs refunded)
    const newTotalRefunded = previouslyRefundedPaise + targetRefundPaise;
    if (newTotalRefunded >= payment.amountPaise) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }
    payment.refundAmountPaise = newTotalRefunded;
    payment.updatedAt = new Date().toISOString();

    // 6. Update booking status and refund record
    const bookings = persistentStorage.getTable('bookings');
    const booking = bookings.find(b => b.id === payment.bookingId || b.bookingReference === payment.bookingId);
    if (booking) {
      booking.paymentStatus = payment.status;
      booking.refundAmount = Number((newTotalRefunded / 100).toFixed(2));
      booking.refundedAt = new Date().toISOString();
    }

    // 7. Audit Log Entry
    const auditLogs = persistentStorage.getTable('admin_audit_logs');
    auditLogs.unshift({
      id: `log_rf_${Date.now()}`,
      adminName: initiatingAdmin,
      action: 'PAYMENT_REFUND_PROCESSED',
      target: payment.bookingReference || payment.bookingId,
      details: `Processed refund of ${formatINR(targetRefundPaise)} (Razorpay Refund ID: ${rzpRefund.id}). Reason: ${reason}`,
      timestamp: new Date().toISOString()
    });

    persistentStorage.persist();

    // 8. Real-time event notifications
    globalRealtimeBus.publish(`customer:booking:${payment.bookingId}`, 'REFUND_PROCESSED', {
      bookingId: payment.bookingId,
      refundId: rzpRefund.id,
      amountPaise: targetRefundPaise,
      formattedAmount: formatINR(targetRefundPaise),
      status: refundRecord.status,
      timestamp: refundRecord.processedAt
    });

    globalRealtimeBus.publish('admin:operations', 'REFUND_PROCESSED', {
      bookingId: payment.bookingId,
      refundId: rzpRefund.id,
      amountPaise: targetRefundPaise,
      initiatingAdmin,
      timestamp: refundRecord.processedAt
    });

    return {
      success: true,
      message: `Refund of ${formatINR(targetRefundPaise)} processed successfully`,
      paymentStatus: payment.status,
      refundRecord,
      refund: refundRecord,
      refundableBalancePaise: payment.amountPaise - newTotalRefunded,
      remainingRefundablePaise: payment.amountPaise - newTotalRefunded
    };
  } finally {
    this.inFlightLocks.delete(payment.id);
  }
}

  /**
   * Retrieves refund history for a booking or payment
   */
  getRefundsForBooking(bookingId) {
    const refunds = persistentStorage.getTable('payment_refunds');
    return refunds.filter(r => r.bookingId === bookingId);
  }
}

export const globalRefundService = new RefundService();
