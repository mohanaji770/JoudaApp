import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Check, Search, Loader2, Map as MapIcon, AlertTriangle } from 'lucide-react';
import { calculateDistance, calculateDeliveryFee } from '../utils/distanceUtils';

// Fix for default Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  onLocationSelected: (lat: number, lng: number) => void;
  onClose: () => void;
  defaultLat?: number;
  defaultLng?: number;
  storeLat: number;
  storeLng: number;
  pricePerKm: number;
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

// Custom component to trigger re-render of map size and fly to new positions
function MapController({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  useEffect(() => {
    map.flyTo(position, map.getZoom(), { animate: true, duration: 1 });
  }, [position, map]);

  return null;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelected, 
  onClose,
  defaultLat = 15.3980555, // Jouda Store Default
  defaultLng = 44.2094444,
  storeLat,
  storeLng,
  pricePerKm
}) => {
  const [position, setPosition] = useState<[number, number]>([defaultLat, defaultLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const handleConfirm = () => {
    onLocationSelected(position[0], position[1]);
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
    setSearchQuery(result.properties.name || '');
    setShowDropdown(false);
  };

  const distanceKm = calculateDistance(storeLat, storeLng, position[0], position[1]);
  const isFar = distanceKm > 20;
  // If > 20km, it's considered shipping to provinces, we set fee to 0 initially or mark it
  const fee = isFar ? 0 : calculateDeliveryFee(distanceKm, pricePerKm);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] md:h-[600px]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              حدد موقع التوصيل
            </h3>
            <p className="text-xs text-gray-500 mt-1">قم بالبحث أو تحريك الخريطة لتحديد موقعك بدقة</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Autocomplete Search Bar */}
        <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 relative z-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchInputChange}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              placeholder="ابحث عن منطقتك في اليمن (مثال: حدة، صنعاء)"
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

        <div className="flex-1 relative bg-gray-100 z-0">
          <MapContainer 
            center={position} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <MapEvents onLocationClick={(lat, lng) => setPosition([lat, lng])} />
            <MapController position={position} />
          </MapContainer>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-3 relative z-10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">المسافة تقريباً: <span className="font-bold text-gray-900 dark:text-white">{distanceKm.toFixed(1)} كم</span></span>
            {!isFar && (
              <span className="text-gray-600 dark:text-gray-400">سعر التوصيل: <span className="font-bold text-brand-600 dark:text-brand-400">{fee === 0 ? 'مجاناً' : `${fee} ر.ي`}</span></span>
            )}
          </div>
          
          {isFar ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-amber-800 dark:text-amber-400 text-sm font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                الموقع أبعد من 20 كم (خارج نطاق التوصيل المباشر)
              </p>
              <p className="text-amber-700 dark:text-amber-500 text-xs leading-relaxed">
                سيتم تحويل طلبك كـ "طلب محافظات أو شحن". سيقوم فريقنا بالتواصل معك لتحديد تكلفة وطريقة الشحن لاحقاً.
              </p>
            </div>
          ) : null}

          <button
            onClick={handleConfirm}
            className={`w-full py-3.5 text-white rounded-xl font-bold text-base flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
              isFar 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30' 
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'
            }`}
          >
            <Check className="w-5 h-5" />
            {isFar 
              ? 'تأكيد كطلب محافظات (شحن)' 
              : fee === 0 ? 'تأكيد الموقع' : `تأكيد الموقع (التوصيل: ${fee} ريال)`}
          </button>
        </div>
      </div>
    </div>
  );
};
