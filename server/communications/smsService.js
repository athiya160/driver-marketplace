/**
 * PERSONAL DRIVER MARKETPLACE - DLT TRANSACTIONAL SMS TEMPLATE BUILDER
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Implements TRAI-compliant Indian DLT notification templates with dynamic variables.
 */

import { globalMsg91Client } from './msg91Client.js';

export const DLT_TEMPLATES = {
  BOOKING_CONFIRMED: {
    id: 'dlt_tpl_bk_01',
    text: (ref, service, city) => `Your personal driver booking ${ref} for ${service} in ${city} has been confirmed. Finding your verified chauffeur now. - SARATHI`
  },
  CHAUFFEUR_ASSIGNED: {
    id: 'dlt_tpl_drv_02',
    text: (ref, driverName, eta) => `Verified Chauffeur ${driverName} is assigned to your ride ${ref}. ETA: ${eta} mins. Track live in your app. - SARATHI`
  },
  CHAUFFEUR_ARRIVED: {
    id: 'dlt_tpl_arr_03',
    text: (ref, driverName) => `Your chauffeur ${driverName} has arrived at the pickup location for booking ${ref}. Please provide your 4-digit Trip OTP to start the journey. - SARATHI`
  },
  TRIP_COMPLETED: {
    id: 'dlt_tpl_cmp_04',
    text: (ref, fare) => `Your journey ${ref} is complete! Final fare: ₹${fare}. Thank you for choosing Personal Driver Marketplace. - SARATHI`
  },
  REFUND_INITIATED: {
    id: 'dlt_tpl_rf_05',
    text: (ref, amount, rzpId) => `Refund of ₹${amount} for booking ${ref} has been processed (Ref: ${rzpId}). Funds will reflect in your UPI/Bank within 24-48 hours. - SARATHI`
  }
};

export class SmsService {
  constructor(client = globalMsg91Client) {
    this.msg91 = client;
  }

  async sendBookingConfirmedSms(phone, bookingRef, serviceTitle, city) {
    const text = DLT_TEMPLATES.BOOKING_CONFIRMED.text(bookingRef, serviceTitle, city);
    return this.msg91.sendTransactionalSms({
      flowId: DLT_TEMPLATES.BOOKING_CONFIRMED.id,
      recipients: [{ mobiles: phone, ref: bookingRef, service: serviceTitle, city }]
    });
  }

  async sendChauffeurAssignedSms(phone, bookingRef, driverName, etaMinutes) {
    return this.msg91.sendTransactionalSms({
      flowId: DLT_TEMPLATES.CHAUFFEUR_ASSIGNED.id,
      recipients: [{ mobiles: phone, ref: bookingRef, driver: driverName, eta: etaMinutes }]
    });
  }

  async sendRefundInitiatedSms(phone, bookingRef, amount, refundId) {
    return this.msg91.sendTransactionalSms({
      flowId: DLT_TEMPLATES.REFUND_INITIATED.id,
      recipients: [{ mobiles: phone, ref: bookingRef, amount, refundId }]
    });
  }
}

export const globalSmsService = new SmsService();
