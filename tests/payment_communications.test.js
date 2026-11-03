/**
 * PHASE 8C AUTOMATED INTEGRATION TEST SUITE
 * Secure Payments, Refunds, OTP Verification & Chauffeur Settlements
 * Platform: Personal Driver Marketplace ("Your Car. Your Journey. Your Driver.")
 */

import assert from 'assert';
import crypto from 'crypto';
import { globalRazorpayClient, RazorpayClient } from '../server/payments/razorpayClient.js';
import { rupeesToPaise, paiseToRupees, validatePaiseAmount, formatINR } from '../server/payments/paymentValidation.js';
import { globalPaymentService, PaymentService } from '../server/payments/paymentService.js';
import { globalRefundService, RefundService } from '../server/payments/refundService.js';
import { globalWebhookService, WebhookService } from '../server/payments/webhookService.js';
import { globalSettlementService, SettlementService } from '../server/payments/settlementService.js';
import { globalOtpService, OtpService, hashOtp } from '../server/communications/otpService.js';
import { globalNotificationService, NotificationService } from '../server/communications/notificationService.js';
import { persistentStorage } from '../server/db/persistentStorage.js';

let passedTests = 0;
function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n🧪 Starting Phase 8C Payments, Refunds, OTP & Settlement Tests...\n');

// -----------------------------------------------------------------------------
// 1. RAZORPAY ORDER CREATION & CURRENCY INTEGER PAISE
// -----------------------------------------------------------------------------
console.log('--- 1. Razorpay Order Creation & Currency Utilities ---');

await itAsync('Creates authoritative Razorpay order strictly in integer paise', async () => {
  const mockBooking = {
    id: `bk_test_${Date.now()}`,
    bookingReference: 'SRT-2026-TEST01',
    totalFare: 599,
    serviceType: 'hourly'
  };

  const result = await globalPaymentService.createPaymentOrder({
    booking: mockBooking,
    customer: { id: 'cust_01', fullName: 'Rajesh Sharma' }
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.orderId.startsWith('order_'));
  assert.strictEqual(result.amountPaise, 59900);
  assert.strictEqual(Number.isInteger(result.amountPaise), true);
  assert.strictEqual(result.currency, 'INR');
});

it('Validates integer paise amounts and rejects floating points or negative numbers', () => {
  const valid = validatePaiseAmount(59900, 'Test Amount');
  assert.strictEqual(valid.valid, true);

  const floatAmount = validatePaiseAmount(599.50, 'Float Amount');
  assert.strictEqual(floatAmount.valid, false);

  const negativeAmount = validatePaiseAmount(-100, 'Negative Amount');
  assert.strictEqual(negativeAmount.valid, false);

  const overCap = validatePaiseAmount(25000000, 'Excess Amount'); // > ₹2,00,000 cap
  assert.strictEqual(overCap.valid, false);
});

it('Converts accurately between Indian Rupees and Integer Paise without rounding errors', () => {
  assert.strictEqual(rupeesToPaise(599), 59900);
  assert.strictEqual(rupeesToPaise(1249.75), 124975);
  assert.strictEqual(paiseToRupees(59900), 599);
  assert.strictEqual(formatINR(59900), '₹599');
});

// -----------------------------------------------------------------------------
// 2. PAYMENT SIGNATURE VERIFICATION & IDEMPOTENCY
// -----------------------------------------------------------------------------
console.log('\n--- 2. Cryptographic Signature Verification & Capture Idempotency ---');

await itAsync('Verifies authentic HMAC SHA-256 payment signature and captures payment', async () => {
  const bookingId = `bk_sig_${Date.now()}`;
  const orderId = `order_sig_${Date.now()}`;
  const paymentId = `pay_sig_${Date.now()}`;

  // Generate authentic signature using test secret
  const secret = process.env.RAZORPAY_KEY_SECRET || 'sarathi_rzp_secret_test_2026';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Pre-seed payment order
  persistentStorage.insert('payments', {
    id: `pay_rec_${Date.now()}`,
    bookingId,
    razorpayOrderId: orderId,
    amountPaise: 79900,
    currency: 'INR',
    status: 'created',
    createdAt: new Date().toISOString()
  });

  const result = await globalPaymentService.verifyAndCapturePayment({
    bookingId,
    orderId,
    paymentId,
    signature: validSignature
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.payment.status, 'captured');
  assert.strictEqual(result.payment.razorpayPaymentId, paymentId);
});

await itAsync('Rejects forged or invalid payment signature', async () => {
  const bookingId = `bk_forge_${Date.now()}`;
  const orderId = `order_forge_${Date.now()}`;
  const paymentId = `pay_forge_${Date.now()}`;
  const forgedSignature = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  persistentStorage.insert('payments', {
    id: `pay_rec_f_${Date.now()}`,
    bookingId,
    razorpayOrderId: orderId,
    amountPaise: 79900,
    currency: 'INR',
    status: 'created',
    createdAt: new Date().toISOString()
  });

  const result = await globalPaymentService.verifyAndCapturePayment({
    bookingId,
    orderId,
    paymentId,
    signature: forgedSignature
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.code, 'INVALID_SIGNATURE');
});

await itAsync('Guarantees idempotent payment verification on duplicate requests', async () => {
  const bookingId = `bk_idem_${Date.now()}`;
  const orderId = `order_idem_${Date.now()}`;
  const paymentId = `pay_idem_${Date.now()}`;

  const secret = process.env.RAZORPAY_KEY_SECRET || 'sarathi_rzp_secret_test_2026';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  persistentStorage.insert('payments', {
    id: `pay_idem_${Date.now()}`,
    bookingId,
    razorpayOrderId: orderId,
    amountPaise: 59900,
    currency: 'INR',
    status: 'created',
    createdAt: new Date().toISOString()
  });

  // First verification
  const first = await globalPaymentService.verifyAndCapturePayment({
    bookingId,
    orderId,
    paymentId,
    signature
  });
  assert.strictEqual(first.success, true);

  // Duplicate verification call
  const second = await globalPaymentService.verifyAndCapturePayment({
    bookingId,
    orderId,
    paymentId,
    signature
  });
  assert.strictEqual(second.success, true);
  assert.strictEqual(second.alreadyProcessed, true);
});

// -----------------------------------------------------------------------------
// 3. RAZORPAY WEBHOOK PROCESSING & DEDUPLICATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. Webhook Cryptographic Verification & Event Deduplication ---');

await itAsync('Verifies raw body signature and processes payment.captured webhook', async () => {
  const eventId = `evt_test_${Date.now()}`;
  const orderId = `order_wh_${Date.now()}`;
  const paymentId = `pay_wh_${Date.now()}`;

  const webhookBody = {
    id: eventId,
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 89900,
          currency: 'INR',
          status: 'captured',
          notes: { bookingId: 'bk_wh_test' }
        }
      }
    }
  };

  const rawBodyString = JSON.stringify(webhookBody);
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'sarathi_webhook_secret_2026';
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyString)
    .digest('hex');

  const response = await globalWebhookService.processWebhook({
    rawBody: rawBodyString,
    signature,
    eventId
  });

  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.result.success, true);
  assert.strictEqual(response.result.eventType, 'payment.captured');
});

await itAsync('Deduplicates duplicate webhook events using x-razorpay-event-id', async () => {
  const eventId = `evt_dedup_${Date.now()}`;
  const webhookBody = {
    id: eventId,
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_d1', order_id: 'ord_d1', amount: 59900 } } }
  };

  const rawBodyString = JSON.stringify(webhookBody);
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'sarathi_webhook_secret_2026';
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyString)
    .digest('hex');

  // First delivery
  await globalWebhookService.processWebhook({ rawBody: rawBodyString, signature, eventId });

  // Duplicate redelivery
  const duplicate = await globalWebhookService.processWebhook({ rawBody: rawBodyString, signature, eventId });
  assert.strictEqual(duplicate.statusCode, 200);
  assert.strictEqual(duplicate.result.alreadyProcessed, true);
  assert.ok(duplicate.result.message.includes('Idempotent skip'));
});

await itAsync('Reconciles out-of-order webhook events without failure', async () => {
  const eventId = `evt_ooo_${Date.now()}`;
  const orderId = `order_ooo_${Date.now()}`;
  const paymentId = `pay_ooo_${Date.now()}`;

  const webhookBody = {
    id: eventId,
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 64900,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };

  const rawBodyString = JSON.stringify(webhookBody);
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'sarathi_webhook_secret_2026';
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyString)
    .digest('hex');

  const res = await globalWebhookService.processWebhook({ rawBody: rawBodyString, signature, eventId });
  assert.strictEqual(res.statusCode, 200);

  // Verify created in storage
  const payments = persistentStorage.getTable('payments');
  const found = payments.find(p => p.razorpayOrderId === orderId);
  assert.ok(found);
  assert.strictEqual(found.status, 'captured');
});

await itAsync('Handles payment.failed webhook gracefully and records failure state', async () => {
  const eventId = `evt_fail_${Date.now()}`;
  const orderId = `order_f_${Date.now()}`;
  const paymentId = `pay_f_${Date.now()}`;

  // Seed created payment
  persistentStorage.insert('payments', {
    id: `pay_f_rec_${Date.now()}`,
    razorpayOrderId: orderId,
    amountPaise: 59900,
    status: 'created'
  });

  const webhookBody = {
    id: eventId,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed due to insufficient funds'
        }
      }
    }
  };

  const rawBodyString = JSON.stringify(webhookBody);
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'sarathi_webhook_secret_2026';
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyString)
    .digest('hex');

  const res = await globalWebhookService.processWebhook({ rawBody: rawBodyString, signature, eventId });
  assert.strictEqual(res.statusCode, 200);

  const payments = persistentStorage.getTable('payments');
  const payment = payments.find(p => p.razorpayOrderId === orderId);
  assert.strictEqual(payment.status, 'failed');
  assert.strictEqual(payment.errorCode, 'BAD_REQUEST_ERROR');
});

// -----------------------------------------------------------------------------
// 4. REFUND PROCESSING & SAFEGUARDS
// -----------------------------------------------------------------------------
console.log('\n--- 4. Refund Processing, Balance Deductions & Safeguards ---');

await itAsync('Processes full verified refund and updates payment status to refunded', async () => {
  const bookingId = `bk_ref_full_${Date.now()}`;
  const paymentId = `pay_rf_f_${Date.now()}`;

  persistentStorage.insert('payments', {
    id: paymentId,
    bookingId,
    razorpayPaymentId: paymentId,
    amountPaise: 59900,
    status: 'captured',
    isTestMode: true,
    createdAt: new Date().toISOString()
  });

  const refundRes = await globalRefundService.processRefund({
    paymentId,
    bookingId,
    amountPaise: 59900,
    reason: 'Customer cancelled prior to driver dispatch'
  });

  assert.strictEqual(refundRes.success, true);
  assert.strictEqual(refundRes.paymentStatus, 'refunded');
  assert.strictEqual(refundRes.refundableBalancePaise, 0);
});

await itAsync('Processes partial refund and maintains accurate residual balance', async () => {
  const bookingId = `bk_ref_part_${Date.now()}`;
  const paymentId = `pay_rf_p_${Date.now()}`;

  persistentStorage.insert('payments', {
    id: paymentId,
    bookingId,
    razorpayPaymentId: paymentId,
    amountPaise: 100000, // ₹1,000.00
    status: 'captured',
    isTestMode: true,
    createdAt: new Date().toISOString()
  });

  // Refund ₹400
  const refund1 = await globalRefundService.processRefund({
    paymentId,
    bookingId,
    amountPaise: 40000,
    reason: 'Partial discount adjustment'
  });

  assert.strictEqual(refund1.success, true);
  assert.strictEqual(refund1.paymentStatus, 'partially_refunded');
  assert.strictEqual(refund1.refundableBalancePaise, 60000); // ₹600 remaining
});

await itAsync('Rejects refund amount exceeding available balance', async () => {
  const bookingId = `bk_ref_exceed_${Date.now()}`;
  const paymentId = `pay_rf_e_${Date.now()}`;

  persistentStorage.insert('payments', {
    id: paymentId,
    bookingId,
    razorpayPaymentId: paymentId,
    amountPaise: 50000, // ₹500
    status: 'captured',
    isTestMode: true,
    createdAt: new Date().toISOString()
  });

  const refundRes = await globalRefundService.processRefund({
    paymentId,
    bookingId,
    amountPaise: 70000, // Requesting ₹700
    reason: 'Exceeding refund'
  });

  assert.strictEqual(refundRes.success, false);
  assert.strictEqual(refundRes.code, 'REFUND_EXCEEDS_BALANCE');
});

await itAsync('Enforces duplicate refund protection once payment is fully refunded', async () => {
  const bookingId = `bk_ref_dup_${Date.now()}`;
  const paymentId = `pay_rf_dup_${Date.now()}`;

  persistentStorage.insert('payments', {
    id: paymentId,
    bookingId,
    razorpayPaymentId: paymentId,
    amountPaise: 49900,
    status: 'captured',
    isTestMode: true,
    createdAt: new Date().toISOString()
  });

  // Exhaust all balance
  await globalRefundService.processRefund({
    paymentId,
    bookingId,
    amountPaise: 49900,
    reason: 'Full refund'
  });

  // Try refunding again
  const dupRefund = await globalRefundService.processRefund({
    paymentId,
    bookingId,
    amountPaise: 10000,
    reason: 'Attempt duplicate refund'
  });

  assert.strictEqual(dupRefund.success, false);
  assert.ok(dupRefund.code === 'INVALID_PAYMENT_STATE' || dupRefund.code === 'REFUND_EXCEEDS_BALANCE');
});

// -----------------------------------------------------------------------------
// 5. DRIVER EARNINGS, ALLOWANCE PASS-THROUGH & SETTLEMENTS
// -----------------------------------------------------------------------------
console.log('\n--- 5. Chauffeur Earnings Splits & Settlement Ledgers ---');

it('Computes 85% Chauffeur / 15% Platform commission split on gross base fare', () => {
  const booking = {
    totalFare: 1000,
    baseFare: 1000,
    extraHoursCharge: 0,
    nightCharge: 0,
    outstationDA: 0
  };

  const split = globalSettlementService.calculateTripFinancialSplit(booking);
  assert.strictEqual(split.totalFarePaise, 100000);
  assert.strictEqual(split.platformCommissionPaise, 15000); // 15% of ₹1,000 = ₹150
  assert.strictEqual(split.driverBasePaise, 85000);          // 85% of ₹1,000 = ₹850
  assert.strictEqual(split.driverNetPayablePaise, 85000);
});

it('Passes through 100% of Driver Outstation DA and Night Allowance directly to Chauffeur', () => {
  const booking = {
    totalFare: 1600,
    baseFare: 1000,
    nightCharge: 250,    // ₹250 Night Allowance
    outstationDA: 350    // ₹350 Outstation DA
  };

  const split = globalSettlementService.calculateTripFinancialSplit(booking);
  // Base 1000 split: 850 driver, 150 platform
  // Plus 100% pass-through: 850 + 250 + 350 = 1450 (1,45,000 paise)
  assert.strictEqual(split.driverNetPayablePaise, 145000);
  assert.strictEqual(split.nightAllowancePaise, 25000);
  assert.strictEqual(split.outstationDAPaise, 35000);
  assert.strictEqual(split.platformCommissionPaise, 15000);
});

it('Generates driver weekly settlement ledger record with accurate aggregate totals', () => {
  const driverId = 'drv_settle_test';
  
  // Seed completed bookings
  persistentStorage.insert('bookings', {
    id: `bk_st1_${Date.now()}`,
    driverId,
    totalFare: 1000,
    baseFare: 1000,
    status: 'completed',
    paymentStatus: 'captured'
  });

  const res = globalSettlementService.generateWeeklySettlement(driverId, '2026-10-26', '2026-11-01');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.settlement.driverId, driverId);
  assert.ok(res.settlement.totalTrips >= 1);
  assert.ok(res.settlement.netPayoutPaise > 0);
});

await itAsync('Executes Route payout adapter safely in internal ledger mode prior to live onboarding', async () => {
  const driverId = 'drv_route_test';
  const genRes = globalSettlementService.generateWeeklySettlement(driverId);
  const settlementId = genRes.settlement.id;

  const payoutRes = await globalSettlementService.executeRouteTransfer(settlementId);
  assert.strictEqual(payoutRes.success, true);
  assert.strictEqual(payoutRes.mode, 'internal_ledger');
  assert.strictEqual(payoutRes.settlement.payoutStatus, 'settled');
  assert.strictEqual(payoutRes.settlement.routeMode, 'internal_ledger_settlement');
});

// -----------------------------------------------------------------------------
// 6. OTP LIFECYCLE, CRYPTOGRAPHIC HASHING & NOTIFICATIONS
// -----------------------------------------------------------------------------
console.log('\n--- 6. Cryptographic OTP Lifecycle & Decoupled Communications ---');

await itAsync('Generates cryptographically random 4-digit OTP and computes salted SHA-256 hash', async () => {
  const phone = '9876543210';
  const res = await globalOtpService.requestOtp(phone, 'test_login');

  assert.strictEqual(res.success, true);
  assert.ok(res.testOtp);
  assert.strictEqual(res.testOtp.length, 4);
  assert.strictEqual(/^\d{4}$/.test(res.testOtp), true);

  // Verify hash in persistent storage matches salted hash
  const otps = persistentStorage.getTable('otp_verifications');
  const record = otps.find(o => o.phone === phone && o.purpose === 'test_login' && !o.isVerified);
  assert.ok(record);
  assert.strictEqual(record.hashedOtp, hashOtp(res.testOtp));
  // Ensure plaintext OTP is NOT in database record
  assert.strictEqual(record.otp, undefined);
  assert.strictEqual(record.testOtp, undefined);
});

await itAsync('Never exposes plaintext OTP in production API responses', async () => {
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const res = await globalOtpService.requestOtp('9876543211', 'prod_auth');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.testOtp, undefined); // Strictly omitted in production!
  } finally {
    process.env.NODE_ENV = prevEnv;
  }
});

it('Verifies correct OTP code successfully and marks record verified', () => {
  const phone = '9876543212';
  const rawOtp = '5829';
  const hashed = hashOtp(rawOtp);

  persistentStorage.insert('otp_verifications', {
    id: `otp_test_${Date.now()}`,
    phone,
    hashedOtp: hashed,
    purpose: 'verification_test',
    attempts: 0,
    maxAttempts: 3,
    isVerified: false,
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    createdAt: new Date().toISOString()
  });

  const verifyRes = globalOtpService.verifyOtp(phone, rawOtp, 'verification_test');
  assert.strictEqual(verifyRes.success, true);
  assert.strictEqual(verifyRes.phone, phone);
});

it('Enforces 3-attempt lockout limit against brute-force attacks', () => {
  const phone = '9876543213';
  const correctOtp = '9182';

  persistentStorage.insert('otp_verifications', {
    id: `otp_lock_${Date.now()}`,
    phone,
    hashedOtp: hashOtp(correctOtp),
    purpose: 'brute_force_test',
    attempts: 0,
    maxAttempts: 3,
    isVerified: false,
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    createdAt: new Date().toISOString()
  });

  // Attempt 1: Fail
  const a1 = globalOtpService.verifyOtp(phone, '0000', 'brute_force_test');
  assert.strictEqual(a1.success, false);
  assert.strictEqual(a1.remainingAttempts, 2);

  // Attempt 2: Fail
  const a2 = globalOtpService.verifyOtp(phone, '1111', 'brute_force_test');
  assert.strictEqual(a2.success, false);
  assert.strictEqual(a2.remainingAttempts, 1);

  // Attempt 3: Fail
  const a3 = globalOtpService.verifyOtp(phone, '2222', 'brute_force_test');
  assert.strictEqual(a3.success, false);
  assert.strictEqual(a3.remainingAttempts, 0);

  // Attempt 4: Blocked due to exceeded attempts
  const a4 = globalOtpService.verifyOtp(phone, correctOtp, 'brute_force_test');
  assert.strictEqual(a4.success, false);
  assert.ok(a4.code === 'ATTEMPTS_EXCEEDED' || a4.code === 'NO_ACTIVE_OTP');
});

await itAsync('Enforces 60-second cooldown protection on rapid OTP requests', async () => {
  const phone = '9876543214';
  
  // Request 1
  const req1 = await globalOtpService.requestOtp(phone, 'cooldown_test');
  assert.strictEqual(req1.success, true);

  // Request 2 immediately
  const req2 = await globalOtpService.requestOtp(phone, 'cooldown_test');
  assert.strictEqual(req2.success, false);
  assert.strictEqual(req2.code, 'COOLDOWN_ACTIVE');
  assert.ok(req2.remainingSeconds > 0 && req2.remainingSeconds <= 60);
});

it('Rejects expired OTP codes older than 5 minutes', () => {
  const phone = '9876543215';
  const rawOtp = '4321';

  persistentStorage.insert('otp_verifications', {
    id: `otp_exp_${Date.now()}`,
    phone,
    hashedOtp: hashOtp(rawOtp),
    purpose: 'expiry_test',
    attempts: 0,
    maxAttempts: 3,
    isVerified: false,
    expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
    createdAt: new Date(Date.now() - 301000).toISOString()
  });

  const res = globalOtpService.verifyOtp(phone, rawOtp, 'expiry_test');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.code, 'OTP_EXPIRED');
});

await itAsync('Ensures SMS delivery failure never crashes or blocks booking notifications', async () => {
  const failingSmsService = {
    sendBookingConfirmedSms: async () => {
      throw new Error('Telecom Gateway Timeout / DLT Template unapproved');
    }
  };

  const safeNotificationService = new NotificationService(failingSmsService);

  // Calling notify with failing SMS
  const result = await safeNotificationService.notifyBookingConfirmed(
    {
      id: 'bk_notif_fail',
      bookingReference: 'SRT-NOTIF-01',
      serviceTitle: 'Airport Transfer',
      pickupCity: 'Bangalore'
    },
    { id: 'c_01', phone: '9876543210' }
  );

  // Must succeed cleanly without throwing!
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.smsResult.success, false);
  assert.ok(result.smsResult.error.includes('Telecom Gateway Timeout'));
});

console.log('\n=======================================================');
console.log(`🏆 Phase 8C Payments & Communications: ${passedTests}/${passedTests} Passed`);
console.log('=======================================================\n');
