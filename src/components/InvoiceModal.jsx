import React from 'react';
import { X, Printer, Download, CheckCircle, FileText } from 'lucide-react';
import { BRAND } from '../config/branding.js';

export default function InvoiceModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const baseFare = booking.baseFare || 299;
  const extraHours = booking.extraHoursCharge || 0;
  const nightCharge = booking.nightCharge || 0;
  const outstationDA = booking.outstationDA || 0;
  const platformFee = booking.platformFee || 49;
  const discount = booking.discountAmount || 0;
  const total = booking.totalFare || 365;

  // 5% GST split into CGST (2.5%) and SGST (2.5%)
  const gstTotal = booking.gstTax || Math.round((total - discount) * 0.05);
  const cgst = (gstTotal / 2).toFixed(2);
  const sgst = (gstTotal / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <h3 className="font-extrabold text-base text-white">GST Tax Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 my-4 font-sans text-xs shadow-inner">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-slate-950">{BRAND.companyLegalName.toUpperCase()}</h2>
              <p className="text-[10px] text-slate-500">GSTIN: {BRAND.gstin} • SAC: 996601</p>
              <p className="text-[10px] text-slate-500">{BRAND.registeredAddress}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded uppercase">
                PAID IN FULL
              </span>
              <p className="text-[10px] font-mono text-slate-500 mt-1">INV-2026-{booking.bookingReference?.slice(-4) || '8821'}</p>
            </div>
          </div>

          {/* Customer & Trip Details */}
          <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-slate-200 text-[11px]">
            <div>
              <p className="font-semibold text-slate-400 text-[9px] uppercase">Billed To:</p>
              <p className="font-bold text-slate-900">{booking.customerName || 'Customer'}</p>
              <p className="text-slate-600">{booking.customerPhone}</p>
              <p className="text-slate-600 truncate">{booking.pickupCity}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-400 text-[9px] uppercase">Service Details:</p>
              <p className="font-bold text-slate-900">{booking.serviceTitle || 'Driver Rental'}</p>
              <p className="text-slate-600">Date: {booking.startDate} • {booking.startTime}</p>
              <p className="text-slate-600">Chauffeur: {booking.driverName}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left mb-3">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-1">Base Rental ({booking.durationHours} hrs)</td>
                <td className="py-1 text-right font-mono">₹{baseFare.toFixed(2)}</td>
              </tr>
              {extraHours > 0 && (
                <tr>
                  <td className="py-1">Extra Hours Charge</td>
                  <td className="py-1 text-right font-mono">₹{extraHours.toFixed(2)}</td>
                </tr>
              )}
              {nightCharge > 0 && (
                <tr>
                  <td className="py-1">Night Allowance (10 PM - 6 AM)</td>
                  <td className="py-1 text-right font-mono">₹{nightCharge.toFixed(2)}</td>
                </tr>
              )}
              {outstationDA > 0 && (
                <tr>
                  <td className="py-1">Outstation Driver Daily Allowance (DA)</td>
                  <td className="py-1 text-right font-mono">₹{outstationDA.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1">Platform Convenience Fee</td>
                <td className="py-1 text-right font-mono">₹{platformFee.toFixed(2)}</td>
              </tr>
              {discount > 0 && (
                <tr className="text-emerald-600 font-medium">
                  <td className="py-1">Promotional Discount ({booking.couponCode})</td>
                  <td className="py-1 text-right font-mono">-₹{discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="text-slate-500 text-[10px]">
                <td className="py-1">CGST (2.5%)</td>
                <td className="py-1 text-right font-mono">₹{cgst}</td>
              </tr>
              <tr className="text-slate-500 text-[10px]">
                <td className="py-1">SGST (2.5%)</td>
                <td className="py-1 text-right font-mono">₹{sgst}</td>
              </tr>
              <tr className="font-extrabold text-sm border-t-2 border-slate-900 text-slate-950">
                <td className="py-2">Total Amount Paid</td>
                <td className="py-2 text-right font-mono">₹{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-400 text-center">
            This is a computer-generated digital tax invoice issued under Rule 48 of CGST Rules, 2017.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
