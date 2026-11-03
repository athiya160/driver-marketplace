/**
 * PERSONAL DRIVER MARKETPLACE - AUTHORITATIVE PAYMENT SERVICE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Manages order creation, backend signature verification, payment capture & idempotency.
 */

import { globalRazorpayClient } from './razorpayClient.js';
import { rupeesToPaise, validatePaiseAmount, validateCurrency } from './paymentValidation.js';
import { persistentStorage } from '../db/persistentStorage.js';
import { globalRealtimeBus } from '../marketplace/realtimeEventBus.js';

export class PaymentService {
  constructor(client = globalRazorpayClient) {
    this.razorpay = client;
  }

  /**
   * 1. Creates an authoritative Razorpay payment order for a booking
   */
  async createPaymentOrder({ booking, customer, amountPaise }) {
    if (!booking) {
      throw new Error('Missing booking for payment order creation');
    }

    // Determine amount in integer paise
    const finalAmountPaise = amountPaise || rupeesToPaise(Number(booking.totalFare) || 599);

    const valCheck = validatePaiseAmount(finalAmountPaise, 'Booking Total');
    if (!valCheck.valid) {
      throw new Error(valCheck.message);
    }

    const receipt = `rcpt_${booking.bookingReference || booking.id}_${Date.now()}`;
    const orderData = await this.razorpay.createOrder({
      amount: finalAmountPaise,
      currency: 'INR',
      receipt,
      notes: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        customerId: customer?.id || booking.customerId,
        serviceType: booking.serviceType
      }
    });

    // Store authoritative payment record in storage
    const paymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      customerId: customer?.id || booking.customerId,
      razorpayOrderId: orderData.id,
      amountPaise: finalAmountPaise,
      currency: 'INR',
      status: 'created',
      paymentMethod: 'upi',
      isTestMode: this.razorpay.isTestMode,
      createdAt: new Date().toISOString()
    };

    persistentStorage.insert('payments', paymentRecord);

    return {
      success: true,
      orderId: orderData.id,
      amountPaise: finalAmountPaise,
      currency: 'INR',
      keyId: this.razorpay.keyId,
      merchantName: 'Personal Driver Marketplace',
      bookingReference: booking.bookingReference,
      isTestMode: this.razorpay.isTestMode
    };
  }

  /**
   * 2. Verifies payment signature and captures payment (Idempotent)
   */
  async verifyAndCapturePayment({ bookingId, orderId, paymentId, signature, user }) {
    if (!orderId || !paymentId) {
      return { success: false, code: 'MISSING_PARAMS', message: 'Razorpay orderId and paymentId are required' };
    }

    // Locate payment record
    const payments = persistentStorage.getTable('payments');
    let payment = payments.find(p => p.razorpayOrderId === orderId || (bookingId && p.bookingId === bookingId));

    if (!payment) {
      // Create record if not found (e.g. from async webhook callback)
      payment = persistentStorage.insert('payments', {
        id: `pay_${Date.now()}`,
        bookingId: bookingId || 'unknown',
        razorpayOrderId: orderId,
        amountPaise: 59900,
        currency: 'INR',
        status: 'created',
        createdAt: new Date().toISOString()
      });
    }

    // Idempotency: If already captured, return success immediately
    if (payment.status === 'captured' && payment.razorpayPaymentId === paymentId) {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment already verified and captured successfully',
        payment
      };
    }

    // Verify cryptographic HMAC SHA-256 signature
    const sigCheck = this.razorpay.verifyPaymentSignature({ orderId, paymentId, signature });
    if (!sigCheck.valid) {
      payment.status = 'failed';
      payment.errorDescription = sigCheck.reason;
      payment.updatedAt = new Date().toISOString();
      persistentStorage.persist();

      return {
        success: false,
        code: 'INVALID_SIGNATURE',
        message: `Cryptographic verification failed: ${sigCheck.reason}`
      };
    }

    // Verify with Razorpay API in production
    const paymentDetails = await this.razorpay.fetchPayment(paymentId);
    if (paymentDetails && paymentDetails.status === 'failed') {
      payment.status = 'failed';
      payment.errorCode = paymentDetails.error_code;
      payment.errorDescription = paymentDetails.error_description;
      persistentStorage.persist();

      return {
        success: false,
        code: 'PAYMENT_FAILED_AT_GATEWAY',
        message: paymentDetails.error_description || 'Payment was declined by bank or UPI gateway'
      };
    }

    // Mark captured
    payment.status = 'captured';
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;
    payment.capturedAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();

    // Update corresponding booking payment status
    if (bookingId) {
      const bookings = persistentStorage.getTable('bookings');
      const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
      if (booking) {
        booking.paymentStatus = 'captured';
        booking.paymentMethod = paymentDetails.method || 'upi';
        booking.capturedAt = payment.capturedAt;
      }
    }

    persistentStorage.persist();

    // Broadcast PAYMENT_CAPTURED via Realtime Event Bus
    globalRealtimeBus.publish(`customer:booking:${bookingId}`, 'PAYMENT_CAPTURED', {
      bookingId,
      orderId,
      paymentId,
      amountPaise: payment.amountPaise,
      status: 'captured',
      timestamp: payment.capturedAt
    });

    globalRealtimeBus.publish('admin:operations', 'PAYMENT_CAPTURED', {
      bookingId,
      orderId,
      paymentId,
      amountPaise: payment.amountPaise,
      timestamp: payment.capturedAt
    });

    return {
      success: true,
      message: 'Payment verified and captured successfully via Razorpay UPI / Card',
      payment
    };
  }

  /**
   * Retrieves payment records for a booking
   */
  getPaymentByBooking(bookingId) {
    const payments = persistentStorage.getTable('payments');
    return payments.filter(p => p.bookingId === bookingId);
  }
}

export const globalPaymentService = new PaymentService();
