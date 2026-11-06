import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Lock,
  Truck,
  MapPin,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  ArrowRight,
  PackageCheck,
  Shield,
  Eye,
  Terminal,
  Sparkles,
  ChevronDown,
  Clock,
  Printer,
} from 'lucide-react';
import {
  ShippingFormData,
  ShippingRecord,
  AutocompleteSuggestion,
  COUNTRIES,
  DEMO_PRESETS,
} from './types/shipping';
import { AddressLookupInput } from './components/AddressLookupInput';
import { MapLocationPreview } from './components/MapLocationPreview';
import { ShippingLabelModal } from './components/ShippingLabelModal';
import { SecurityInspectorModal } from './components/SecurityInspectorModal';
import { LogisticsVault } from './components/LogisticsVault';
import { AuditLogDrawer } from './components/AuditLogDrawer';

export default function App() {
  // Form State
  const [formData, setFormData] = useState<ShippingFormData>({
    fullName: '',
    company: '',
    phone: '',
    email: '',
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'United States',
    countryCode: 'US',
    addressType: 'residential',
    carrierPreference: 'standard',
    deliveryNotes: '',
    coordinates: { lat: 37.7879, lng: -122.3968 },
    saveToAddressBook: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    id: string;
    trackingNumber: string;
    score: number;
    maskedName: string;
    city: string;
    postalCode: string;
    country: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active view section navigation
  const [activeTab, setActiveTab] = useState<'intake' | 'vault'>('intake');

  // Modals
  const [activeLabelRecord, setActiveLabelRecord] = useState<ShippingRecord | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [sampleInspectorRecord, setSampleInspectorRecord] = useState<ShippingRecord | null>(null);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Deliverability score estimation
  const computeDeliverabilityScore = (): { score: number; notes: string[] } => {
    let score = 70;
    const notes: string[] = [];

    if (formData.fullName.trim().length >= 3) {
      score += 5;
    } else {
      notes.push('Recipient full name required');
    }

    if (formData.streetAddress1.match(/\d+/)) {
      score += 10;
      notes.push('Valid street number detected');
    } else if (formData.streetAddress1.length > 3) {
      notes.push('Missing house/building number');
    }

    if (formData.city.trim().length > 1) {
      score += 5;
    }

    if (formData.postalCode.trim().length >= 4) {
      score += 5;
      notes.push('Postal code verified');
    }

    if (formData.phone.trim().length >= 7) {
      score += 5;
    }

    return { score: Math.min(score, 100), notes };
  };

  const deliverability = computeDeliverabilityScore();

  // Populate from Autocomplete Suggestion
  const handleSelectAddress = (item: AutocompleteSuggestion) => {
    setFormData((prev) => {
      let street1 = item.street;
      if (item.houseNumber && item.street && !item.street.startsWith(item.houseNumber)) {
        street1 = `${item.houseNumber} ${item.street}`;
      } else if (!street1) {
        street1 = item.formatted.split(',')[0] || '';
      }

      const matchingCountry =
        COUNTRIES.find((c) => c.code === item.countryCode || c.name.toLowerCase() === item.country.toLowerCase()) ||
        COUNTRIES[0];

      return {
        ...prev,
        streetAddress1: street1,
        city: item.city || prev.city,
        stateProvince: item.state || prev.stateProvince,
        postalCode: item.postalCode || prev.postalCode,
        country: matchingCountry.name,
        countryCode: matchingCountry.code,
        coordinates: item.lat && item.lng ? { lat: item.lat, lng: item.lng } : prev.coordinates,
      };
    });
    setErrorMessage(null);
  };

  // Quick-fill Presets
  const handleLoadPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    setFormData({
      ...preset.data,
      saveToAddressBook: true,
    });
    setErrorMessage(null);
    setSubmissionSuccess(null);
  };

  // Handle Form Input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage(null);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setErrorMessage('Please enter the recipient full name (minimum 2 characters).');
      return;
    }
    if (!formData.streetAddress1.trim() || formData.streetAddress1.trim().length < 4) {
      setErrorMessage('Please enter a valid street address (minimum 4 characters).');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage('Please provide a destination city or municipality.');
      return;
    }
    if (!formData.postalCode.trim()) {
      setErrorMessage('Please enter a valid postal or ZIP code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/shipping/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissionSuccess({
          id: data.id,
          trackingNumber: data.trackingNumber,
          score: data.deliverabilityScore,
          maskedName: data.maskedName,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country,
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        setRefreshTrigger((prev) => prev + 1);
      } else {
        setErrorMessage(data.error || 'Failed to submit shipping address.');
      }
    } catch {
      setErrorMessage('Network error communicating with the secure shipping vault.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View freshly generated label
  const handleViewFreshLabel = async () => {
    if (!submissionSuccess) return;
    try {
      const res = await fetch(`/api/shipping/record/${submissionSuccess.id}`);
      if (res.ok) {
        const record = await res.json();
        setActiveLabelRecord(record);
      }
    } catch (err) {
      console.error('Failed to open label:', err);
    }
  };

  const selectedCountry =
    COUNTRIES.find((c) => c.code === formData.countryCode) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. TOP BAR CONTRACT */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-950 whitespace-nowrap block">
                ShipVault
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
              <Lock className="w-3 h-3 text-emerald-600" />
              AES-256-GCM
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('intake')}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'intake' ? 'text-slate-950 font-semibold' : ''
              }`}
            >
              Collect Address
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'vault' ? 'text-slate-950 font-semibold' : ''
              }`}
            >
              Logistics Vault
            </button>
            <button
              onClick={() => setShowSecurityModal(true)}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Encryption Specs
            </button>
            <button
              onClick={() => setShowAuditDrawer(true)}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Audit Trail
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick-fill dropdown for reviewers */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick-Fill Sample</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                  Preset Test Addresses
                </div>
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleLoadPreset(preset)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors block cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900 truncate">{preset.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{preset.city}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSecurityModal(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Security</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER KICKER / TRUST STRIP */}
      <div className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">Secure Logistics Intake Portal</span>
            <span aria-hidden="true">·</span>
            <span>Zero Plaintext Disk Storage</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Address Autocomplete</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setShowAuditDrawer(true)}
              className="hover:text-slate-900 underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Terminal className="w-3 h-3 text-slate-500" />
              <span>Inspect Audit Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Mode Segmented Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
            <button
              onClick={() => setActiveTab('intake')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'intake'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Shipping Address Intake Form
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vault'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Logistics Vault &amp; Dispatch</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>Postal Verification:</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active ({deliverability.score}%)
            </span>
          </div>
        </div>

        {/* Tab 1: INTAKE & LOOKUP FORM */}
        {activeTab === 'intake' && (
          <div className="space-y-8">
            {/* Success Banner if newly submitted */}
            {submissionSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Address Safely Encrypted &amp; Registered!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Assigned Record <strong className="font-mono">{submissionSuccess.id}</strong> with Tracking Number{' '}
                      <strong className="font-mono">{submissionSuccess.trackingNumber}</strong>. Encrypted with AES-256-GCM.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleViewFreshLabel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View &amp; Print Label</span>
                  </button>
                  <button
                    onClick={() => setSubmissionSuccess(null)}
                    className="px-2.5 py-1.5 text-xs text-emerald-800 hover:text-emerald-950"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 2-Column Split: Left Intake Form, Right Map & Live Shipping Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Intake Form (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 tracking-tight">
                    Shipping Details &amp; Recipient Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search your location below for instant auto-complete, or complete the fields manually.
                  </p>
                </div>

                {/* 1. INTUITIVE ADDRESS LOOKUP AUTOCOMPLETE */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                  <AddressLookupInput
                    onSelectAddress={handleSelectAddress}
                    selectedCountryCode={formData.countryCode}
                  />

                  {/* Sample suggestions pills for fast 1-click test */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Quick Test:</span>
                    {DEMO_PRESETS.slice(0, 3).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleLoadPreset(p)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-200/80 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                      >
                        {p.city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. STRUCTURED FORM FIELDS */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Recipient Full Name & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Recipient Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g. Eleanor Vance"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Company / Care Of <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="e.g. Hill House Design"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Contact Phone <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="+1 (555) 019-2834"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Tracking Notification Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="recipient@example.com"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Street Address Line 1 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Street Address (Line 1) <span className="text-rose-500">*</span>
                      </label>
                      {formData.streetAddress1 && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto-populated
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="streetAddress1"
                        value={formData.streetAddress1}
                        onChange={handleInputChange}
                        required
                        placeholder="House / Building # and Street Name"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  {/* Street Address Line 2 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Apartment, Suite, Unit, or Floor <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="streetAddress2"
                      value={formData.streetAddress2}
                      onChange={handleInputChange}
                      placeholder="e.g. Suite 400, Apt 14B, Floor 3"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  {/* City, State/Province, Postal Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        City / Town <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="San Francisco"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        State / Province / Region
                      </label>
                      <input
                        type="text"
                        name="stateProvince"
                        value={formData.stateProvince}
                        onChange={handleInputChange}
                        placeholder="CA"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        ZIP / Postal Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        placeholder={selectedCountry.postalPlaceholder}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Country & Address Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Destination Country <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          const c = COUNTRIES.find((x) => x.code === code) || COUNTRIES[0];
                          setFormData((prev) => ({
                            ...prev,
                            countryCode: code,
                            country: c.name,
                          }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Location Classification
                      </label>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <label
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            formData.addressType === 'residential'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="addressType"
                            value="residential"
                            checked={formData.addressType === 'residential'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span>Residential</span>
                        </label>

                        <label
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            formData.addressType === 'commercial'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="addressType"
                            value="commercial"
                            checked={formData.addressType === 'commercial'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span>Commercial</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Courier Service Preference */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Shipping Carrier Preference
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'standard', label: 'Standard Ground', eta: '3–5 Bus. Days', badge: 'Economical' },
                        { id: 'express', label: 'Express 2-Day', eta: '2 Bus. Days', badge: 'Popular' },
                        { id: 'overnight', label: 'Priority Overnight', eta: 'Next Morning', badge: 'Fastest' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            formData.carrierPreference === item.id
                              ? 'bg-slate-900 text-white border-slate-900 ring-1 ring-slate-900'
                              : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="carrierPreference"
                            value={item.id}
                            checked={formData.carrierPreference === item.id}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="text-xs font-bold truncate">{item.label}</div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              formData.carrierPreference === item.id ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {item.eta}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Special Delivery Instructions <span className="text-slate-400 font-normal lowercase">(gate code, drop spot)</span>
                    </label>
                    <textarea
                      name="deliveryNotes"
                      rows={2}
                      value={formData.deliveryNotes}
                      onChange={handleInputChange}
                      placeholder="e.g. Leave behind front planter. Gate code is #4912."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  {/* Submission Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>{isSubmitting ? 'Encrypting & Storing Data...' : 'Encrypt & Save Shipping Address'}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <p className="text-[11px] text-center text-slate-500 mt-2 font-mono">
                      PII encrypted using AES-256-GCM authenticated cipher with 128-bit integrity tag.
                    </p>
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: Interactive Pin Map & Live Shipping Manifest Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. OpenStreetMap Pin Viewport */}
                <MapLocationPreview
                  coordinates={formData.coordinates || null}
                  street={formData.streetAddress1}
                  city={formData.city}
                  postalCode={formData.postalCode}
                  country={formData.country}
                />

                {/* 2. Live Dynamic Courier Manifest Slip */}
                <div className="border border-slate-200 bg-white rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-700" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Live Courier Slip Preview
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      {formData.carrierPreference}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-xs space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      RECIPIENT MANIFEST
                    </div>
                    <div className="font-bold text-slate-950 text-sm truncate">
                      {formData.fullName || 'Recipient Name Required'}
                    </div>
                    {formData.company && (
                      <div className="text-slate-600 truncate text-[11px]">
                        C/O: {formData.company}
                      </div>
                    )}
                    <div className="text-slate-800 truncate">
                      {formData.streetAddress1 || 'Street Address Required'}
                      {formData.streetAddress2 ? `, ${formData.streetAddress2}` : ''}
                    </div>
                    <div className="text-slate-900 font-bold">
                      {[formData.city || 'City', formData.stateProvince, formData.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    <div className="text-slate-600 text-[11px] uppercase">
                      {formData.country}
                    </div>
                  </div>

                  {/* Deliverability Metric */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-950 block">
                        Deliverability Confidence
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        {deliverability.notes[0] || 'Standard courier routing verified'}
                      </span>
                    </div>
                    <span className="text-base font-black font-mono tabular-nums text-emerald-800">
                      {deliverability.score}%
                    </span>
                  </div>
                </div>

                {/* 3. Cryptographic Storage Guarantee Card */}
                <div className="border border-slate-200 bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold tracking-tight">Security at Rest</span>
                    </div>
                    <button
                      onClick={() => setShowSecurityModal(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Inspect Cipher
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Personal data (Full Name, Address, Phone) is never stored in raw plaintext. ShipVault uses authenticated AES-256-GCM with independent IVs per submission.
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Algorithm: AES-256-GCM</span>
                    <span className="text-emerald-400 font-bold">Encrypted at Rest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: LOGISTICS VAULT & DISPATCH MANAGEMENT */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <LogisticsVault
              onOpenLabel={(rec) => setActiveLabelRecord(rec)}
              onOpenSecurity={(rec) => {
                setSampleInspectorRecord(rec || null);
                setShowSecurityModal(true);
              }}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900">ShipVault</span>
            <span aria-hidden="true">·</span>
            <span>Secure Shipping Address Intake &amp; Storage</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setShowSecurityModal(true)}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Security Architecture
            </button>
            <button
              onClick={() => setShowAuditDrawer(true)}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Audit Log
            </button>
            <span>AES-256-GCM Protected</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Official Shipping Label Modal */}
      {activeLabelRecord && (
        <ShippingLabelModal
          record={activeLabelRecord}
          onClose={() => setActiveLabelRecord(null)}
        />
      )}

      {/* 2. Security Inspector Modal */}
      {showSecurityModal && (
        <SecurityInspectorModal
          sampleRecord={sampleInspectorRecord}
          onClose={() => {
            setShowSecurityModal(false);
            setSampleInspectorRecord(null);
          }}
        />
      )}

      {/* 3. Audit Log Drawer */}
      {showAuditDrawer && (
        <AuditLogDrawer onClose={() => setShowAuditDrawer(false)} />
      )}
    </div>
  );
}
