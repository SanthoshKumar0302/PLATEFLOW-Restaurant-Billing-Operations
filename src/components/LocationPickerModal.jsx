import { useState, useEffect } from 'react';
import { MapPin, X, Check, ChevronRight, Sparkles, Edit3 } from 'lucide-react';
import { INDIA_LOCATIONS, DEFAULT_HOTEL_LOCATION } from '../utils/indiaLocations';

export default function LocationPickerModal({ isOpen, onClose, currentLocation, onSaveLocation }) {
  const [selectedState, setSelectedState] = useState(currentLocation?.state || 'Tamil Nadu');
  const [selectedCity, setSelectedCity] = useState(currentLocation?.city || 'Chennai');
  const [customPincode, setCustomPincode] = useState(currentLocation?.pincode || '600123');
  const [streetAddress, setStreetAddress] = useState(currentLocation?.address || '124 Culinary Blvd');
  const [step, setStep] = useState(1); // 1 = state, 2 = city & area, 3 = review/confirm

  useEffect(() => {
    if (isOpen && currentLocation) {
      setSelectedState(currentLocation.state || 'Tamil Nadu');
      setSelectedCity(currentLocation.city || 'Chennai');
      setCustomPincode(currentLocation.pincode || '600123');
      setStreetAddress(currentLocation.address || '124 Culinary Blvd');
    }
  }, [isOpen, currentLocation]);

  if (!isOpen) return null;

  const stateData = INDIA_LOCATIONS.find((s) => s.state === selectedState) || INDIA_LOCATIONS[0];
  const cityData = stateData.cities.find((c) => c.name === selectedCity) || stateData.cities[0];

  const handleStateSelect = (stateName) => {
    setSelectedState(stateName);
    const targetState = INDIA_LOCATIONS.find((s) => s.state === stateName);
    if (targetState?.cities?.length) {
      const firstCity = targetState.cities[0];
      setSelectedCity(firstCity.name);
      setCustomPincode(firstCity.pincode || '600001');
    }
    setStep(2);
  };

  const handleCitySelect = (cityObj) => {
    setSelectedCity(cityObj.name);
    setCustomPincode(cityObj.pincode || `${stateData.pinPrefix || '600'}001`);
  };

  const handleAreaSelect = (areaPincode) => {
    setCustomPincode(areaPincode);
    setStep(3);
  };

  const handleConfirm = () => {
    const cleanPin = (customPincode || cityData?.pincode || '600123').replace(/\D/g, '').slice(0, 6);
    const finalLocation = {
      address: streetAddress.trim() || '124 Culinary Blvd',
      state: selectedState,
      city: selectedCity,
      pincode: cleanPin.length === 6 ? cleanPin : (cityData?.pincode || '600123'),
    };
    onSaveLocation(finalLocation);
    onClose();
  };

  const oneLineAddress = `${streetAddress.trim() || '124 Culinary Blvd'}, ${selectedCity}, ${selectedState} - ${customPincode || '600123'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="card-base w-full max-w-xl bg-graphite-900 border border-graphite-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto select-none">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-graphite-800 hover:bg-graphite-700 text-graphite-400 hover:text-ivory-100 transition-colors"
          aria-label="Close location selector"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/30">
              <MapPin size={20} />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ivory-50 flex items-center gap-2">
                Set Restaurant Location &amp; PIN Code
              </h2>
              <p className="text-xs text-graphite-400">
                Select Indian State, City &amp; Postal Sub-zone for accurate 6-digit bill printing
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-graphite-950 border border-graphite-800 text-xs font-mono">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center font-bold transition-all ${
              step === 1 ? 'bg-accent text-graphite-950 shadow-sm' : 'text-graphite-400 hover:text-ivory-100'
            }`}
          >
            1. State
          </button>
          <ChevronRight size={14} className="text-graphite-600" />
          <button
            onClick={() => setStep(2)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center font-bold transition-all ${
              step === 2 ? 'bg-accent text-graphite-950 shadow-sm' : 'text-graphite-400 hover:text-ivory-100'
            }`}
          >
            2. City &amp; PIN ({selectedCity})
          </button>
          <ChevronRight size={14} className="text-graphite-600" />
          <button
            onClick={() => setStep(3)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center font-bold transition-all ${
              step === 3 ? 'bg-accent text-graphite-950 shadow-sm' : 'text-graphite-400 hover:text-ivory-100'
            }`}
          >
            3. Confirm Bill
          </button>
        </div>

        {/* ─── Step 1: State Selection ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-graphite-400 font-mono">
              <span>All States in India ({INDIA_LOCATIONS.length})</span>
              <span className="text-accent font-bold">Current: {selectedState}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {INDIA_LOCATIONS.map((loc) => {
                const isSelected = selectedState === loc.state;
                return (
                  <button
                    key={loc.state}
                    onClick={() => handleStateSelect(loc.state)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
                      isSelected
                        ? 'bg-accent/15 text-accent border-accent/50 shadow-sm'
                        : 'bg-graphite-800/60 text-graphite-300 border-graphite-700/60 hover:border-accent/30 hover:bg-graphite-800 hover:text-ivory-100'
                    }`}
                  >
                    <span>{loc.state}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-graphite-900/80 text-graphite-400 font-bold">
                      {loc.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Step 2: City & Area Selection ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* City Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-graphite-400 font-mono">
                <span>
                  Major Cities in <strong className="text-accent">{selectedState}</strong>
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-graphite-400 hover:text-accent underline"
                >
                  Change State
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {stateData.cities.map((city) => {
                  const isSelected = selectedCity === city.name;
                  return (
                    <button
                      key={city.name}
                      onClick={() => handleCitySelect(city)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-accent text-graphite-950 border-accent shadow-md shadow-accent/20'
                          : 'bg-graphite-800/80 text-graphite-300 border-graphite-700 hover:border-accent/40 hover:text-ivory-100'
                      }`}
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Postal Sub-Zones with accurate PIN Codes */}
            {cityData?.areas && cityData.areas.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-graphite-800">
                <div className="flex items-center justify-between text-xs text-graphite-400 font-mono">
                  <span>Postal Sub-Zones / Areas in {selectedCity}:</span>
                  <span className="text-accent font-bold">Click to set PIN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {cityData.areas.map((area) => {
                    const isSelected = customPincode === area.pincode;
                    return (
                      <button
                        key={area.pincode + area.name}
                        onClick={() => handleAreaSelect(area.pincode)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-accent/15 text-accent border-accent/50 font-bold'
                            : 'bg-graphite-800/50 text-graphite-300 border-graphite-700/60 hover:bg-graphite-800 hover:border-accent/30'
                        }`}
                      >
                        <span className="truncate pr-2">{area.name}</span>
                        <span className="font-mono text-accent font-bold px-2 py-0.5 rounded bg-graphite-900 border border-graphite-700/60 text-[11px] flex-shrink-0">
                          {area.pincode}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom PIN Code Manual Input */}
            <div className="p-3.5 rounded-2xl bg-graphite-950 border border-graphite-800 space-y-2">
              <label className="text-xs text-graphite-400 font-mono uppercase flex items-center justify-between">
                <span>Or Enter Custom 6-Digit PIN Code:</span>
                <span className="text-accent font-bold">{selectedCity} prefix: {stateData.pinPrefix || '600'}...</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={customPincode}
                  onChange={(e) => setCustomPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 px-3 py-2 bg-graphite-900 border border-graphite-700 rounded-lg text-sm text-ivory-100 font-mono font-bold tracking-widest focus:outline-none focus:border-accent text-center"
                  placeholder="e.g. 600123"
                />
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1"
                >
                  <span>Apply</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Review & Final Line Confirmation ─────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-graphite-950 border border-graphite-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-graphite-400 uppercase">
                  Verified Restaurant Location
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-mono font-bold border border-green-500/30">
                  READY FOR BILL
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-graphite-400 block mb-1">
                    Street Address / Hotel Branch
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-graphite-900 border border-graphite-700 rounded-lg text-sm text-ivory-100 focus:outline-none focus:border-accent font-medium"
                    placeholder="e.g. 124 Culinary Blvd, Ground Floor"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2.5 bg-graphite-900 rounded-lg border border-graphite-800">
                    <span className="text-[10px] text-graphite-500 block">STATE</span>
                    <span className="font-bold text-ivory-100 truncate block">{selectedState}</span>
                  </div>
                  <div className="p-2.5 bg-graphite-900 rounded-lg border border-graphite-800">
                    <span className="text-[10px] text-graphite-500 block">CITY</span>
                    <span className="font-bold text-ivory-100 truncate block">{selectedCity}</span>
                  </div>
                  <div className="p-2.5 bg-accent/10 rounded-lg border border-accent/30">
                    <span className="text-[10px] text-accent block">PIN CODE</span>
                    <span className="font-black text-accent text-sm block">{customPincode || '600123'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Line-by-Line Print Output */}
            <div className="p-3 bg-graphite-800/60 rounded-xl border border-dashed border-accent/40 text-center space-y-1">
              <div className="text-[10px] uppercase font-mono text-graphite-400 flex items-center justify-center gap-1">
                <Sparkles size={11} className="text-accent" />
                Live Single-Line Receipt Address:
              </div>
              <div className="text-xs font-mono font-bold text-accent break-words">
                {oneLineAddress}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Back to Areas / PIN
              </button>
              <button
                onClick={handleConfirm}
                className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-accent/20"
              >
                <Check size={16} /> Save &amp; Print on Bills
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
