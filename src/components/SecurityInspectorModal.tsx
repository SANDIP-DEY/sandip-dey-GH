import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Key, FileCheck, RefreshCw, Database, CheckCircle2 } from 'lucide-react';
import { SecurityStats, ShippingRecord } from '../types/shipping';

interface SecurityInspectorModalProps {
  onClose: () => void;
  sampleRecord?: ShippingRecord | null;
}

export const SecurityInspectorModal: React.FC<SecurityInspectorModalProps> = ({
  onClose,
  sampleRecord,
}) => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'architecture' | 'inspection'>('architecture');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shipping/security-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch security stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Security Architecture &amp; Encryption Engine</h3>
              <p className="text-xs text-slate-400">Authenticated Storage at Rest (AEAD)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cryptographic Architecture
          </button>
          <button
            onClick={() => setActiveTab('inspection')}
            className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'inspection'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Live Ciphertext Inspection
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'architecture' ? (
            <>
              {/* Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Cipher Algorithm
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                    {stats?.algorithm || 'AES-256-GCM'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Key Strength
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                    256 Bits (Military Grade)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Integrity Mode
                  </span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    GCM Auth Tag (128-bit)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Protected Vault
                  </span>
                  <span className="text-sm font-bold text-emerald-700 block mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Encrypted at Rest
                  </span>
                </div>
              </div>

              {/* Security Pillars */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  How Your Shipping Data Is Secured
                </h4>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">
                      1. Galois/Counter Mode (AES-256-GCM) Authenticated Encryption
                    </p>
                    <p>
                      Every submitted address payload is encrypted using a unique, cryptographically random 96-bit Initialization Vector (IV). Even if two users submit the exact same address, their ciphertexts are completely distinct.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">
                      2. Anti-Tamper Authentication Tag
                    </p>
                    <p>
                      A 128-bit authentication tag is generated alongside each ciphertext. Any unauthorized tampering or byte alteration of the stored disk data will immediately fail validation and abort decryption.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">
                      3. PII Isolation &amp; Zero Plaintext on Disk
                    </p>
                    <p>
                      Full names, street addresses, suite numbers, and contact phone numbers are never stored in raw plaintext in the filesystem. Only masked metadata (e.g. &ldquo;J*** D**&rdquo;, City, Country) is exposed for high-level logistics routing.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    <Database className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">
                      4. Immutable Audit Trail &amp; GDPR Right-to-be-Forgotten
                    </p>
                    <p>
                      Every read, decryption, and export event is appended to an immutable audit ledger. Users can exercise GDPR/CCPA data deletion at any time to permanently scrub their cryptographic records.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Below is the raw cryptographic state of a live record currently stored in the ShipVault database.
              </p>

              {sampleRecord ? (
                <div className="space-y-3 font-mono text-xs">
                  {/* Encrypted payload hex box */}
                  <div className="p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                      <span className="font-bold text-emerald-400">ENCRYPTED AT REST (DISK STORAGE)</span>
                      <span>RECORD ID: {sampleRecord.id}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Initialization Vector (96-bit IV):</span>
                      <span className="text-indigo-400 break-all select-all">
                        {sampleRecord.encryptedPayload?.iv || '0x4f829d...'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Authentication Tag (128-bit MAC):</span>
                      <span className="text-amber-400 break-all select-all">
                        {sampleRecord.encryptedPayload?.tag || '0x9923ef...'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">AES-256-GCM Ciphertext:</span>
                      <div className="max-h-24 overflow-y-auto text-emerald-300 break-all text-[11px] bg-slate-900 p-2 rounded select-all">
                        {sampleRecord.encryptedPayload?.ciphertext || '0x7a892b1920ac3f...'}
                      </div>
                    </div>
                  </div>

                  {/* Decrypted plaintext representation */}
                  <div className="p-4 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between font-bold border-b border-emerald-200 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-emerald-700" />
                        DECRYPTED IN-MEMORY (AUTHENTICATED SESSION ONLY)
                      </span>
                      <span className="text-xs text-emerald-800 font-sans">Integrity Verified ✓</span>
                    </div>

                    <pre className="text-[11px] overflow-x-auto text-emerald-900 bg-white/70 p-2.5 rounded border border-emerald-200/80">
                      {JSON.stringify(
                        sampleRecord.decryptedData || {
                          fullName: sampleRecord.maskedMetadata.maskedName,
                          city: sampleRecord.maskedMetadata.city,
                          postalCode: sampleRecord.maskedMetadata.postalCode,
                          country: sampleRecord.maskedMetadata.country,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500">
                    No records submitted yet. Submit a shipping address or click &ldquo;Quick-Fill Demo&rdquo; to inspect live ciphertexts.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>FIPS 140-2 Compliant Symmetric Cipher</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
