import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Eye,
  Printer,
  Trash2,
  RefreshCw,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Truck,
  Package,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { ShippingRecord } from '../types/shipping';

interface LogisticsVaultProps {
  onOpenLabel: (record: ShippingRecord) => void;
  onOpenSecurity: (record?: ShippingRecord) => void;
  refreshTrigger: number;
}

export const LogisticsVault: React.FC<LogisticsVaultProps> = ({
  onOpenLabel,
  onOpenSecurity,
  refreshTrigger,
}) => {
  const [records, setRecords] = useState<ShippingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecryptedMode, setIsDecryptedMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchRecords = async (decrypt = isDecryptedMode) => {
    setIsLoading(true);
    try {
      const url = `/api/shipping/records${decrypt ? '?decrypt=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch shipping records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(isDecryptedMode);
  }, [refreshTrigger, isDecryptedMode]);

  const handleToggleDecrypt = () => {
    const nextMode = !isDecryptedMode;
    setIsDecryptedMode(nextMode);
    fetchRecords(nextMode);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/shipping/record/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRecords(isDecryptedMode);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/shipping/record/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchRecords(isDecryptedMode);
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = ['Record ID', 'Tracking #', 'Recipient Name', 'Street', 'City', 'Postal Code', 'Country', 'Carrier', 'Status', 'Date'];
    const rows = records.map((r) => {
      const name = isDecryptedMode && r.decryptedData ? r.decryptedData.fullName : r.maskedMetadata.maskedName;
      const street = isDecryptedMode && r.decryptedData ? r.decryptedData.streetAddress1 : 'ENCRYPTED_PII';
      return [
        r.id,
        r.trackingNumber,
        `"${name}"`,
        `"${street}"`,
        `"${r.maskedMetadata.city}"`,
        `"${r.maskedMetadata.postalCode}"`,
        `"${r.maskedMetadata.country}"`,
        r.carrierPreference,
        r.status,
        new Date(r.createdAt).toISOString(),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShipVault_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    const nameMatch =
      r.maskedMetadata.maskedName.toLowerCase().includes(q) ||
      (r.decryptedData?.fullName.toLowerCase().includes(q) ?? false);
    const idMatch = r.id.toLowerCase().includes(q) || r.trackingNumber.toLowerCase().includes(q);
    const cityMatch = r.maskedMetadata.city.toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || idMatch || cityMatch;

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header & Filter Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Encrypted Logistics Vault
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
              {records.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Addresses are safely stored in AES-256-GCM ciphertext until authorized fulfillment.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Privacy / Decrypt Mode Switch */}
          <button
            onClick={handleToggleDecrypt}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isDecryptedMode
                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle between PII Masked Mode and Authorized Decrypted Mode"
          >
            {isDecryptedMode ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Decrypted Mode (PII Exposed)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Masked Privacy Mode</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchRecords(isDecryptedMode)}
            disabled={isLoading}
            className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Search & Filters */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, tracking #, or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {['all', 'verified', 'packed', 'in_transit', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Records' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Decrypted Mode Security Warning Banner */}
      {isDecryptedMode && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Authorized Decryption Session Active:</strong> Personally Identifiable Information (PII) is currently decrypted in memory for shipping dispatch. Decrypted reads are being logged to the audit ledger.
            </span>
          </div>
          <button
            onClick={() => onOpenSecurity()}
            className="font-semibold underline hover:text-amber-950 shrink-0 cursor-pointer"
          >
            Audit Details
          </button>
        </div>
      )}

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Tracking &amp; ID</th>
              <th className="py-3 px-4">Recipient Name</th>
              <th className="py-3 px-4">Destination Address</th>
              <th className="py-3 px-4">Carrier &amp; Type</th>
              <th className="py-3 px-4">Fulfillment Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
                  <span>Loading encrypted vault records...</span>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No matching shipping records</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Submit a shipping address above to see it securely stored here.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const name =
                  isDecryptedMode && r.decryptedData
                    ? r.decryptedData.fullName
                    : r.maskedMetadata.maskedName;

                const addressLine =
                  isDecryptedMode && r.decryptedData
                    ? `${r.decryptedData.streetAddress1}${r.decryptedData.streetAddress2 ? `, ${r.decryptedData.streetAddress2}` : ''}`
                    : '•••••••••••••••••••• (Encrypted)';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID & Tracking */}
                    <td className="py-3 px-4 align-top">
                      <div className="font-mono font-bold text-slate-900 text-xs tracking-tight">
                        {r.id}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                        {r.trackingNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Recipient Name */}
                    <td className="py-3 px-4 align-top">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {isDecryptedMode ? (
                          <Unlock className="w-3 h-3 text-amber-500 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                        <span>{name}</span>
                      </div>
                      {isDecryptedMode && r.decryptedData?.company && (
                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                          {r.decryptedData.company}
                        </div>
                      )}
                      {isDecryptedMode && r.decryptedData?.phone && (
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {r.decryptedData.phone}
                        </div>
                      )}
                    </td>

                    {/* Destination Address */}
                    <td className="py-3 px-4 align-top max-w-xs">
                      <div className={`truncate ${isDecryptedMode ? 'text-slate-900 font-medium' : 'text-slate-400 font-mono text-[11px]'}`}>
                        {addressLine}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {r.maskedMetadata.city}, {r.maskedMetadata.stateProvince} {r.maskedMetadata.postalCode}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {r.maskedMetadata.country}
                      </div>
                    </td>

                    {/* Carrier & Type */}
                    <td className="py-3 px-4 align-top">
                      <span className="inline-block uppercase font-bold text-[10px] tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {r.carrierPreference}
                      </span>
                      <div className="text-[11px] text-slate-500 capitalize mt-1">
                        {r.addressType} delivery
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                        Score: {r.deliverabilityScore}%
                      </div>
                    </td>

                    {/* Status with quick progression selector */}
                    <td className="py-3 px-4 align-top">
                      <select
                        value={r.status}
                        onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                        className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="packed">Packed</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open Label Modal */}
                        <button
                          onClick={() => onOpenLabel(r)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Print / View Courier Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Inspect Crypto Raw */}
                        <button
                          onClick={() => onOpenSecurity(r)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Inspect AES-256 Ciphertext"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* GDPR Purge */}
                        {deleteConfirmId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteRecord(r.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Scrub & Permanently Delete Record (GDPR)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
