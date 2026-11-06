import React, { useState } from 'react';
import { X, Printer, Copy, Check, ShieldCheck, Download, Truck, PackageCheck } from 'lucide-react';
import { ShippingRecord } from '../types/shipping';

interface ShippingLabelModalProps {
  record: ShippingRecord;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Extract decrypted data or masked metadata
  const data = record.decryptedData || {
    fullName: record.maskedMetadata.maskedName,
    company: '',
    phone: '',
    email: '',
    streetAddress1: 'Street Address On File',
    streetAddress2: '',
    city: record.maskedMetadata.city,
    stateProvince: record.maskedMetadata.stateProvince,
    postalCode: record.maskedMetadata.postalCode,
    country: record.maskedMetadata.country,
    countryCode: record.maskedMetadata.countryCode,
    deliveryNotes: '',
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(record.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.trackingNumber}-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate realistic SVG Barcode
  const barcodeBars = [
    3, 1, 2, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1, 4,
    1, 2, 2, 3, 1, 1, 3, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print-bg">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Standard Logistics Dispatch Label</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {record.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Label Body */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex items-center justify-center">
          {/* Authentic Courier Shipping Label Card */}
          <div className="w-full max-w-md bg-white border-2 border-slate-900 p-5 shadow-sm text-slate-900 print-card font-sans">
            {/* Top Barcode Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase block text-slate-600">
                  CARRIER DISPATCH SERVICE
                </span>
                <span className="text-xl font-black uppercase tracking-tight block">
                  {record.carrierPreference === 'overnight'
                    ? 'PRIORITY OVERNIGHT'
                    : record.carrierPreference === 'express'
                    ? 'EXPRESS 2-DAY'
                    : 'STANDARD GROUND'}
                </span>
                <span className="text-xs font-semibold text-slate-700 block">
                  DELIVERY CONFIRMATION &amp; SIGNATURE REQUIRED
                </span>
              </div>
              <div className="border-2 border-slate-900 px-3 py-1 text-center font-black text-2xl tracking-tighter">
                {record.carrierPreference === 'overnight' ? 'P1' : 'G4'}
              </div>
            </div>

            {/* Origin & Date */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b-2 border-slate-900 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  SHIP FROM:
                </span>
                <p className="font-semibold text-slate-900">ShipVault Logistics Center</p>
                <p className="text-slate-600 text-[11px]">800 Gateway Blvd, Suite 100</p>
                <p className="text-slate-600 text-[11px]">South San Francisco, CA 94080</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  MANIFEST DETAILS:
                </span>
                <p className="font-mono text-[11px] text-slate-800">
                  DATE: {new Date(record.createdAt).toLocaleDateString()}
                </p>
                <p className="font-mono text-[11px] text-slate-800">WEIGHT: 1.40 LBS</p>
                <p className="font-mono text-[11px] text-slate-800 uppercase">
                  TYPE: {record.addressType}
                </p>
              </div>
            </div>

            {/* Recipient Block (Ship To) */}
            <div className="py-4 border-b-2 border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                SHIP TO (RECIPIENT):
              </span>
              <div className="pl-2 border-l-3 border-slate-900 space-y-0.5">
                <p className="text-base font-bold text-slate-950 uppercase">
                  {data.fullName}
                </p>
                {data.company && (
                  <p className="text-xs font-semibold text-slate-700 uppercase">
                    C/O: {data.company}
                  </p>
                )}
                <p className="text-sm font-semibold text-slate-900">
                  {data.streetAddress1}
                </p>
                {data.streetAddress2 && (
                  <p className="text-sm font-semibold text-slate-900">
                    {data.streetAddress2}
                  </p>
                )}
                <p className="text-sm font-black text-slate-950 uppercase tracking-wide">
                  {data.city}, {data.stateProvince} {data.postalCode}
                </p>
                <p className="text-xs font-bold text-slate-800 uppercase">
                  {data.country}
                </p>
                {data.phone && (
                  <p className="text-[11px] font-mono text-slate-600 mt-1">
                    TEL: {data.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {data.deliveryNotes && (
              <div className="py-2 border-b-2 border-slate-900 bg-slate-50 px-2 text-[11px] text-slate-700">
                <span className="font-bold text-slate-900 mr-1">COURIER NOTE:</span>
                {data.deliveryNotes}
              </div>
            )}

            {/* Barcode & Tracking Block */}
            <div className="pt-4 flex flex-col items-center">
              {/* SVG 1D Barcode */}
              <div className="w-full h-14 flex items-center justify-center gap-0.5 px-4 overflow-hidden">
                {barcodeBars.map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-black h-12"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>

              {/* Human-readable Tracking Number */}
              <div className="mt-2 text-center">
                <p className="font-mono text-xs font-black tracking-widest text-slate-950">
                  {record.trackingNumber}
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                  USPS / GLOBAL LOGISTICS TRACKING #
                </p>
              </div>

              {/* Security & Authenticity Seal */}
              <div className="mt-4 pt-3 border-t border-slate-300 w-full flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AES-256-GCM SECURED AT REST
                </span>
                <span className="uppercase font-semibold">SCORE: {record.deliverabilityScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTracking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tracking Copied' : 'Copy Tracking #'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Manifest</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
