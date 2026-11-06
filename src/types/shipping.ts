export interface ShippingFormData {
  fullName: string;
  company?: string;
  phone: string;
  email: string;
  streetAddress1: string;
  streetAddress2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  countryCode: string;
  addressType: 'residential' | 'commercial';
  carrierPreference: 'standard' | 'express' | 'overnight';
  deliveryNotes?: string;
  coordinates?: { lat: number; lng: number } | null;
  saveToAddressBook?: boolean;
}

export interface AutocompleteSuggestion {
  id: string;
  formatted: string;
  street: string;
  houseNumber: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  confidence: number;
}

export interface ShippingRecord {
  id: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'verified' | 'packed' | 'in_transit' | 'delivered';
  carrierPreference: 'standard' | 'express' | 'overnight';
  addressType: 'residential' | 'commercial';
  deliverabilityScore: number;
  coordinates: { lat: number; lng: number } | null;
  maskedMetadata: {
    maskedName: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
    countryCode: string;
  };
  encryptedPayload?: {
    iv: string;
    tag: string;
    ciphertext: string;
  };
  decryptedData?: {
    fullName: string;
    company?: string;
    phone: string;
    email?: string;
    streetAddress1: string;
    streetAddress2?: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
    countryCode: string;
    deliveryNotes?: string;
  };
  auditTrail?: Array<{
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    details?: string;
  }>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  recordId?: string;
  action: string;
  actor: string;
  details?: string;
}

export interface SecurityStats {
  algorithm: string;
  keyLength: string;
  mode: string;
  totalRecords: number;
  auditEventsCount: number;
  storageEngine: string;
  gdprCompliant: boolean;
  lastAuditEvent?: AuditLogItem | null;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  postalPlaceholder: string;
  postalPattern?: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', postalPlaceholder: '94105 or 94105-1804' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', postalPlaceholder: 'M5V 3L9' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', postalPlaceholder: 'SW1A 2AA' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', postalPlaceholder: '2000' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', postalPlaceholder: '10115' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', postalPlaceholder: '75001' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', postalPlaceholder: '100-0001' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', postalPlaceholder: '018956' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', postalPlaceholder: '110001' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', postalPlaceholder: '1012 JS' },
];

export const DEMO_PRESETS: Array<{ label: string; city: string; data: ShippingFormData }> = [
  {
    label: 'San Francisco Tech HQ',
    city: 'San Francisco, CA',
    data: {
      fullName: 'Sarah Chen',
      company: 'Apex Robotics Labs',
      phone: '+1 (415) 890-2341',
      email: 's.chen@apexlabs.io',
      streetAddress1: '500 Howard Street',
      streetAddress2: 'Floor 12, Suite 1200',
      city: 'San Francisco',
      stateProvince: 'CA',
      postalCode: '94105',
      country: 'United States',
      countryCode: 'US',
      addressType: 'commercial',
      carrierPreference: 'overnight',
      deliveryNotes: 'Building security desk on ground floor. Sign at reception.',
      coordinates: { lat: 37.7879, lng: -122.3968 },
    },
  },
  {
    label: 'Manhattan Residential Loft',
    city: 'New York, NY',
    data: {
      fullName: 'Julian Hayes',
      company: '',
      phone: '+1 (212) 430-8812',
      email: 'julian.hayes@gmail.com',
      streetAddress1: '350 5th Avenue',
      streetAddress2: 'Apartment 34C',
      city: 'New York',
      stateProvince: 'NY',
      postalCode: '10118',
      country: 'United States',
      countryCode: 'US',
      addressType: 'residential',
      carrierPreference: 'express',
      deliveryNotes: 'Attended lobby 24/7. Package room staff will accept.',
      coordinates: { lat: 40.7484, lng: -73.9857 },
    },
  },
  {
    label: 'London Central Studio',
    city: 'London, UK',
    data: {
      fullName: 'Oliver Bennett',
      company: 'Kinetic Motion Design',
      phone: '+44 20 7946 0912',
      email: 'oliver@kineticmotion.co.uk',
      streetAddress1: '10 Downing Street',
      streetAddress2: 'Lower Ground Unit',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 2AA',
      country: 'United Kingdom',
      countryCode: 'GB',
      addressType: 'commercial',
      carrierPreference: 'standard',
      deliveryNotes: 'Please ring unit buzzer 2 on arrival.',
      coordinates: { lat: 51.5034, lng: -0.1276 },
    },
  },
  {
    label: 'Tokyo Metropolitan Office',
    city: 'Tokyo, Japan',
    data: {
      fullName: 'Kenji Takahashi',
      company: 'Kurogane Optics',
      phone: '+81 3 5555 0143',
      email: 'k.takahashi@kurogane.jp',
      streetAddress1: '1-1 Chiyoda',
      streetAddress2: 'Tower A, 8F',
      city: 'Chiyoda City',
      stateProvince: 'Tokyo',
      postalCode: '100-8111',
      country: 'Japan',
      countryCode: 'JP',
      addressType: 'commercial',
      carrierPreference: 'express',
      deliveryNotes: 'Drop with front concierge.',
      coordinates: { lat: 35.6852, lng: 139.7528 },
    },
  },
];
