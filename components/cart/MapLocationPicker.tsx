import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Check, Search, Loader2, Map as MapIcon, AlertTriangle, LocateFixed } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { calculateDistance, calculateDeliveryFeeDetails } from '../../utils/distanceUtils';

// Custom iOS-like Map Pin
const iosPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="relative flex items-end justify-center w-[40px] h-[50px] -ml-[20px] -mt-[45px]">
      <div class="absolute bottom-0 w-5 h-1.5 bg-black/40 rounded-[100%] blur-[2px]"></div>
      <div class="absolute bottom-1 w-9 h-9 bg-[#FF3B30] rounded-[50%_50%_50%_0] rotate-[-45deg] shadow-lg flex items-center justify-center border-[1.5px] border-white/20 transition-transform duration-300 hover:scale-110">
        <div class="w-3 h-3 bg-white rounded-full shadow-sm"></div>
      </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

interface MapLocationPickerProps {
  onLocationSelected: (lat: number, lng: number, source: 'gps' | 'map_click' | 'search') => void;
  onClose: () => void;
  defaultLat?: number;
  defaultLng?: number;
  initialLocationSelected?: boolean;
  storeLat: number;
  storeLng: number;
  pricePerKm: number;
  minCustomerDistanceKm?: number;
}

// Custom component to handle map clicks
function MapEvents({ onLocationClick }: { onLocationClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    // Wait for any entry animations to complete before invalidating size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [map]);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      map.setView(position, map.getZoom(), { animate: false });
      return;
    }
    map.flyTo(position, map.getZoom(), { animate: true, duration: 1 });
  }, [position, map]);

  return null;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelected, 
  onClose,
  defaultLat = 15.3980555, // Jouda Store Default
  defaultLng = 44.2094444,
  initialLocationSelected = false,
  storeLat,
  storeLng,
  pricePerKm,
  minCustomerDistanceKm = 0.2
}) => {
  const [position, setPosition] = useState<[number, number]>([defaultLat, defaultLng]);
  const [hasUserSelectedLocation, setHasUserSelectedLocation] = useState(initialLocationSelected);
  const [selectionSource, setSelectionSource] = useState<'gps' | 'map_click' | 'search' | null>(
    initialLocationSelected ? 'map_click' : null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const handleConfirm = () => {
    if (!hasUserSelectedLocation || !selectionSource) return;
    if (isTooCloseToStore) return;
    onLocationSelected(position[0], position[1], selectionSource);
    onClose();
  };

  const fetchSearchResults = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      // bbox for Yemen: minLon, minLat, maxLon, maxLat
      const bbox = '41.5,12.0,54.5,19.0';
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=${bbox}&limit=5`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      if (data && data.features) {
        setSearchResults(data.features);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      fetchSearchResults(val);
    }, 500); // Debounce
  };

  const selectResult = (result: any) => {
    const [lon, lat] = result.geometry.coordinates;
    setPosition([lat, lon]);
    setHasUserSelectedLocation(true);
    setSelectionSource('search');
    setSearchQuery(result.properties.name || '');
    setShowDropdown(false);
  };

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      // Request permissions only on native platforms (Android/iOS)
      // Web handles permissions automatically during getCurrentPosition
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location === 'denied' || permission.location === 'prompt') {
          const req = await Geolocation.requestPermissions();
          if (req.location === 'denied') {
             throw new Error('Permission denied');
          }
        }
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setPosition([coordinates.coords.latitude, coordinates.coords.longitude]);
      setHasUserSelectedLocation(true);
      setSelectionSource('gps');
      setSearchQuery('📍 تم تحديد موقعك الحالي');
    } catch (error) {
      console.error('Error getting location:', error);
      alert('ما قدرنا نحدد موقعك! 📍\n\nشيك على الـ GPS وصلاحيات تطبيقك أو متصفحك وجرب ثاني.');
    } finally {
      setIsLocating(false);
    }
  };

  const distanceKm = calculateDistance(storeLat, storeLng, position[0], position[1]);
  const isFar = distanceKm > 20;
  const isTooCloseToStore = distanceKm < minCustomerDistanceKm;
  const canConfirmLocation = hasUserSelectedLocation && !isTooCloseToStore;
  // If > 20km, it's considered shipping to provinces, we set fee to 0 initially or mark it
  const fee = isFar ? 0 : calculateDeliveryFeeDetails(distanceKm, pricePerKm).boundedFee;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[92dvh] max-h-[680px] md:h-[600px]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center gap-3 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              وين نوصل طلبك؟
            </h3>
            <p className="text-xs text-gray-500 mt-1">حرك الخريطة أو ابحث عن منطقتك عشان نوصلك أسرع! 🛵</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Autocomplete Search Bar */}
        <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 relative z-10 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchInputChange}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              placeholder="ابحث عن منطقتك (مثال: حدة، صنعاء)"
              className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 text-sm dark:text-white transition-all shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => selectResult(res)}
                    className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors flex items-center gap-3"
                  >
                    <MapIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{res.properties.name}</span>
                      {res.properties.state && (
                        <span className="text-xs text-gray-500">{res.properties.state}, {res.properties.country}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative bg-gray-100 z-0 min-h-[220px]">
          <MapContainer 
            center={position} 
            zoom={15} 
            style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&hl=ar&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
            <Marker position={position} icon={iosPinIcon} />
            <MapEvents onLocationClick={(lat, lng) => {
              setPosition([lat, lng]);
              setHasUserSelectedLocation(true);
              setSelectionSource('map_click');
            }} />
            <MapController position={position} />
          </MapContainer>

          {/* Locate Me FAB (Pill Style) */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-max bg-white text-gray-800 px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 font-bold hover:scale-105 active:scale-95 transition-all border-2 border-brand-500 disabled:opacity-70 disabled:scale-100"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            ) : (
              <LocateFixed className="w-5 h-5 text-brand-600 animate-pulse" />
            )}
            <span className="text-sm">{isLocating ? 'جاري التحديد...' : 'حدد موقعي الحالي 📍'}</span>
          </button>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-3 relative z-10 shrink-0 max-h-[42dvh] overflow-y-auto">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">المسافة: <span className="font-bold text-gray-900 dark:text-white">{distanceKm.toFixed(1)} كم</span></span>
            {hasUserSelectedLocation && !isFar && !isTooCloseToStore && (
              <span className="text-gray-600 dark:text-gray-400">التوصيل: <span className="font-bold text-brand-600 dark:text-brand-400">{fee === 0 ? 'مجاناً 🎉' : <>{fee}<span className="saudi-riyal mr-1">{"\u00ea"}</span></>}</span></span>
            )}
          </div>
          
          {!hasUserSelectedLocation ? (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <p className="text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-bold flex items-start gap-2 leading-relaxed">
                <MapPin className="w-4 h-4 shrink-0" />
                حدد موقع بيتك أولاً: اضغط على الخريطة أو استخدم زر "حدد موقعي الحالي".
              </p>
            </div>
          ) : isTooCloseToStore ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3">
              <p className="text-red-700 dark:text-red-300 text-sm font-black flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                الموقع قريب جداً من جوده
              </p>
              <p className="text-red-600 dark:text-red-300 text-[11px] leading-relaxed font-bold">
                حدد موقع بيتك بدقة، أو استخدم زر تحديد الموقع الحالي.
              </p>
            </div>
          ) : isFar ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <p className="text-amber-800 dark:text-amber-400 text-sm font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                موقعك بعيد شوية! (خارج نطاق التوصيل السريع)
              </p>
              <p className="text-amber-700 dark:text-amber-500 text-xs leading-relaxed">
                بنعتبر طلبك "شحن محافظات"، وفريقنا بيتواصل معك عشان نرتب تفاصيل التكلفة والشحن.. ولا يهمك!
              </p>
            </div>
          ) : null}

          <button
            onClick={handleConfirm}
            disabled={!canConfirmLocation}
            className={`w-full py-3.5 text-white rounded-xl font-bold text-base flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
              !canConfirmLocation
                ? 'bg-gray-400 dark:bg-gray-700 shadow-none cursor-not-allowed'
                : isFar 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30' 
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'
            }`}
          >
            <Check className="w-5 h-5" />
            {!hasUserSelectedLocation
              ? 'حدد موقعك أولاً'
              : isTooCloseToStore
                ? 'الموقع غير واضح'
                : isFar 
              ? 'أكد الطلب (شحن محافظات)' 
              : fee === 0 ? 'اعتمد الموقع ✔️' : <>اعتمد الموقع (التوصيل: {fee}<span className="saudi-riyal mr-1">{"\u00ea"}</span>)</>}
          </button>
        </div>
      </div>
    </div>
  );
};
