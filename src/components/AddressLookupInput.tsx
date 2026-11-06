import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Navigation, CheckCircle2, Globe2 } from 'lucide-react';
import { AutocompleteSuggestion, COUNTRIES } from '../types/shipping';

interface AddressLookupInputProps {
  onSelectAddress: (suggestion: AutocompleteSuggestion) => void;
  selectedCountryCode: string;
}

export const AddressLookupInput: React.FC<AddressLookupInputProps> = ({
  onSelectAddress,
  selectedCountryCode,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch address suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/address/autocomplete?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setIsOpen(true);
        setActiveIndex(-1);
      }
    } catch (err) {
      console.error('Address lookup failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle typing with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setLocationError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 250);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Select suggestion
  const handleSelect = (item: AutocompleteSuggestion) => {
    setQuery(item.formatted);
    setIsOpen(false);
    onSelectAddress(item);
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Use current geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`/api/address/reverse?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            const formatted = [
              data.streetAddress1,
              data.city,
              data.stateProvince,
              data.postalCode,
              data.country,
            ]
              .filter(Boolean)
              .join(', ');

            const suggestion: AutocompleteSuggestion = {
              id: `geo-${Date.now()}`,
              formatted,
              street: data.streetAddress1 || '',
              houseNumber: '',
              city: data.city || '',
              state: data.stateProvince || '',
              postalCode: data.postalCode || '',
              country: data.country || 'United States',
              countryCode: data.countryCode || 'US',
              lat,
              lng,
              confidence: 95,
            };

            setQuery(formatted);
            onSelectAddress(suggestion);
          } else {
            setLocationError('Could not resolve your coordinate address.');
          }
        } catch {
          setLocationError('Network error resolving location.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please search your address manually.');
        } else {
          setLocationError('Unable to retrieve location. Please type manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const countryFlag = COUNTRIES.find((c) => c.code === selectedCountryCode)?.flag || '🌐';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Intuitive Address Lookup</span>
        </label>
        <span className="text-xs text-slate-500 font-medium">Type any street or place</span>
      </div>

      {/* Main Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <MapPin className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Start typing your street address, building, or postal code..."
          className="w-full pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-xs"
          autoComplete="off"
        />

        {/* Right side tools: Clear & Geolocation */}
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Clear address search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            title="Auto-detect current location"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden sm:inline">Use Location</span>
          </button>
        </div>
      </div>

      {/* Geolocation error notice */}
      {locationError && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
          <span>{locationError}</span>
        </p>
      )}

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-40 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1 divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Verified Address Matches ({suggestions.length})</span>
            <span>Press Enter to select</span>
          </div>

          <ul className="max-h-72 overflow-y-auto">
            {suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              const flag = COUNTRIES.find((c) => c.code === item.countryCode)?.flag || '📍';

              return (
                <li
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors flex items-start gap-2.5 ${
                    isSelected ? 'bg-slate-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50/80'
                  }`}
                >
                  <span className="text-base select-none mt-0.5">{flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.street ? (
                        <>
                          {item.houseNumber ? `${item.houseNumber} ` : ''}
                          {item.street}
                        </>
                      ) : (
                        item.formatted.split(',')[0]
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {[item.city, item.state, item.postalCode, item.country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{item.confidence}% Match</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
