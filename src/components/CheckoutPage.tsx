import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Check, Truck, MapPin, Locate, ChevronRight, Search, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCart } from '@/cart-context';
import { useUser, useClerk } from '@/auth';
import { formatPrice, generateOrderId, getEstimatedDelivery } from '@/data';
import type { CustomerInfo, OrderDetails } from '@/types';

// Custom Leaflet marker icon
const deliveryMarkerIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CheckoutPageProps {
  onBack: () => void;
  onPlaceOrder: (order: OrderDetails) => Promise<void> | void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

// Component to fly map to new coords
function MapFlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// Component to handle map click
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<Partial<CustomerInfo>> {
  if (MAPS_KEY) {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}`);
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { lat, lng };
    const comps: any[] = result.address_components || [];
    const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || '';
    const streetNum = get('street_number');
    const route = get('route');
    const sublocality = get('sublocality_level_1') || get('sublocality');
    const city = get('locality') || get('administrative_area_level_2');
    const stateRaw = get('administrative_area_level_1');
    const pincode = get('postal_code');
    const address = [route, sublocality].filter(Boolean).join(', ') || result.formatted_address;
    const state = INDIAN_STATES.find((s) => s.toLowerCase() === stateRaw.toLowerCase()) || stateRaw;
    return { address, city, state, pincode, lat, lng, doorNo: streetNum || '' };
  } else {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    const addr = data.address || {};
    const address = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const stateRaw = addr.state || '';
    const pincode = addr.postcode || '';
    const state = INDIAN_STATES.find((s) => s.toLowerCase() === stateRaw.toLowerCase()) || stateRaw;
    return { address, city, state, pincode, lat, lng, doorNo: addr.house_number || '' };
  }
}

export default function CheckoutPage({ onBack, onPlaceOrder }: CheckoutPageProps) {
  const { items, subtotal, clearCart } = useCart();
  const { user, isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();

  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: '',
    email: '',
    phone: '',
    doorNo: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
    lat: undefined,
    lng: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [mapError, setMapError] = useState<string>('');
  const [placing, setPlacing] = useState(false);

  // Map state — default center: India
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Address search state
  const [addressSearch, setAddressSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shipping = subtotal >= 2000 ? 0 : 80;
  const total = subtotal + shipping;

  // Autofill from Google / Clerk on mount
  useEffect(() => {
    if (!user) return;
    const computedName = user.fullName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');
    const computedEmail = user.primaryEmailAddress?.emailAddress || '';
    const computedPhone = user.primaryPhoneNumber?.phoneNumber?.replace(/\D/g, '').slice(-10) || '';

    setCustomer((prev) => ({
      ...prev,
      fullName: prev.fullName || computedName,
      email: prev.email || computedEmail,
      phone: prev.phone || computedPhone,
    }));
  }, [user]);

  const update = (field: keyof CustomerInfo, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const applyGeoResult = useCallback((result: Partial<CustomerInfo>, coords: [number, number]) => {
    setCustomer((prev) => ({
      ...prev,
      ...result,
      lat: coords[0],
      lng: coords[1],
      doorNo: result.doorNo || prev.doorNo || '',
      address: result.address || prev.address || '',
    }));
    setMarkerPos(coords);
    setFlyTo(coords);
    setMapError('');
  }, []);

  // Search suggestions
  const handleAddressSearch = (val: string) => {
    setAddressSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!val.trim()) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        if (MAPS_KEY) {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(val)}&components=country:in&key=${MAPS_KEY}`
          );
          const data = await res.json();
          setSuggestions((data.predictions || []).map((p: any) => ({
            id: p.place_id,
            label: p.description,
            main: p.structured_formatting?.main_text,
            secondary: p.structured_formatting?.secondary_text,
            isGoogle: true,
          })));
        } else {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&countrycodes=in&format=json&addressdetails=1&limit=5`
          );
          const data = await res.json();
          setSuggestions(data.map((item: any) => ({
            id: item.place_id,
            label: item.display_name,
            main: item.display_name.split(',')[0],
            secondary: item.display_name.split(',').slice(1).join(',').trim(),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.address,
          })));
        }
      } catch { setSuggestions([]); }
    }, 400);
  };

  const selectSuggestion = async (s: any) => {
    setSuggestions([]);
    setAddressSearch('');
    if (s.isGoogle) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.id}&fields=address_components,formatted_address,geometry&key=${MAPS_KEY}`
        );
        const data = await res.json();
        const comps: any[] = data.result?.address_components || [];
        const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || '';
        const streetNum = get('street_number');
        const route = get('route');
        const sublocality = get('sublocality_level_1') || get('sublocality');
        const city = get('locality') || get('administrative_area_level_2');
        const stateRaw = get('administrative_area_level_1');
        const pincode = get('postal_code');
        const address = [route, sublocality].filter(Boolean).join(', ') || data.result?.formatted_address || s.label;
        const state = INDIAN_STATES.find((st) => st.toLowerCase() === stateRaw.toLowerCase()) || stateRaw;
        const loc = data.result?.geometry?.location;
        const coords: [number, number] = loc ? [loc.lat, loc.lng] : [20.5937, 78.9629];
        applyGeoResult({ address, city, state, pincode, doorNo: streetNum || '' }, coords);
      } catch { update('address', s.label); }
    } else {
      // Nominatim result
      const addr = s.address || {};
      const address = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || s.main;
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const stateRaw = addr.state || '';
      const pincode = addr.postcode || '';
      const state = INDIAN_STATES.find((st) => st.toLowerCase() === stateRaw.toLowerCase()) || stateRaw;
      applyGeoResult({ address, city, state, pincode, doorNo: addr.house_number || '' }, [s.lat, s.lng]);
    }
  };

  // Map click → reverse geocode
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setCustomer((prev) => ({ ...prev, lat, lng }));
    setMapError('');
    try {
      const result = await reverseGeocode(lat, lng);
      setCustomer((prev) => ({
        ...prev,
        ...result,
        lat,
        lng,
        doorNo: result.doorNo || prev.doorNo || '',
      }));
    } catch { /* ignore */ }
  }, []);

  // Auto-detect via geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const lat = coords.latitude;
          const lng = coords.longitude;
          const result = await reverseGeocode(lat, lng);
          applyGeoResult(result, [lat, lng]);
        } catch {
          applyGeoResult({}, [coords.latitude, coords.longitude]);
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        alert('Could not detect location. Please click directly on the map to pin your location.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CustomerInfo, string>> = {};
    let hasMapError = false;

    if (!customer.fullName.trim()) e.fullName = 'Full name is required';
    if (!customer.email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) e.email = 'Invalid email address';
    if (!customer.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(customer.phone.replace(/\s/g, ''))) e.phone = 'Enter valid 10-digit mobile number';

    // MAP PIN IS COMPULSORY!
    if (!markerPos || !customer.lat || !customer.lng) {
      setMapError('⚠️ Pinning your delivery location on the map is required. Please click anywhere on the map or tap "Use My Current GPS" so we can navigate directly to your door.');
      hasMapError = true;
    } else {
      setMapError('');
    }

    if (!customer.address.trim()) e.address = 'Street/area address is required';
    if (!customer.city.trim()) e.city = 'City is required';
    if (!customer.state.trim()) e.state = 'State is required';
    if (!customer.pincode.trim()) e.pincode = 'PIN code is required';
    else if (!/^[0-9]{6}$/.test(customer.pincode)) e.pincode = 'Enter 6-digit PIN code';

    setErrors(e);

    if (hasMapError) {
      const el = document.getElementById('checkout-map-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setPlacing(true);

    const finalDoor = (customer.doorNo || '').trim();
    const finalStreet = customer.address.trim();
    const fullStreetAddress = finalDoor ? `${finalDoor}, ${finalStreet}` : finalStreet;

    const orderCustomer: CustomerInfo = {
      ...customer,
      doorNo: finalDoor,
      address: fullStreetAddress,
      lat: markerPos ? markerPos[0] : customer.lat,
      lng: markerPos ? markerPos[1] : customer.lng,
    };

    const order: OrderDetails = {
      orderId: generateOrderId(),
      items: [...items],
      subtotal,
      shipping,
      total,
      customer: orderCustomer,
      paymentMethod: 'cod',
      placedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      estimatedDelivery: getEstimatedDelivery(),
    };
    try {
      await onPlaceOrder(order);
      clearCart();
    } catch (err) {
      console.error('Failed to submit order:', err);
    } finally {
      setPlacing(false);
    }
  };

  // Case 1: Compulsory Login Gate
  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </button>

        <div className="card p-8 sm:p-10 text-center bg-white border border-brand-200/80 shadow-luxury space-y-6 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full">
              Authentication Required
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 mt-3 mb-2">
              Sign In to Place Your Order
            </h1>
            <p className="text-xs sm:text-sm text-brand-600 max-w-md mx-auto leading-relaxed">
              We require Google authentication before checkout so your order details are securely tracked and your delivery contact info is automatically filled.
            </p>
          </div>

          <div className="max-w-xs mx-auto pt-2">
            <button
              type="button"
              onClick={() => clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white border-2 border-brand-300 hover:border-brand-600 text-brand-950 text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 group cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              <ChevronRight className="w-4 h-4 ml-auto text-brand-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-6 border-t border-brand-100">
            <div className="p-3 rounded-xl bg-cream-50 border border-brand-200/60 text-xs">
              <span className="font-bold text-brand-900 block mb-0.5">⚡ Auto-fill Profile</span>
              <p className="text-[11px] text-brand-500">Your full name & email pre-fill in 1 click.</p>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 border border-brand-200/60 text-xs">
              <span className="font-bold text-brand-900 block mb-0.5">📦 Live Dispatch</span>
              <p className="text-[11px] text-brand-500">Track delivery status & waybill updates.</p>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 border border-brand-200/60 text-xs">
              <span className="font-bold text-brand-900 block mb-0.5">🛡️ Verified Security</span>
              <p className="text-[11px] text-brand-500">Secured with Google OAuth 2.0.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Cart empty
  if (!placing && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-900 mb-2">Your cart is empty</h1>
        <p className="text-brand-600 mb-6">Add some cashews before checking out.</p>
        <button onClick={onBack} className="btn-primary">Browse Cashews</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </button>

      <div className="flex items-center gap-2 mb-8 text-sm">
        <span className="text-brand-500">Cart</span>
        <ChevronRight className="w-4 h-4 text-brand-300" />
        <span className="font-semibold text-brand-900">Checkout</span>
        <ChevronRight className="w-4 h-4 text-brand-300" />
        <span className="text-brand-400">Confirmation</span>
      </div>

      <h1 className="font-serif text-3xl font-bold text-brand-950 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">

          {/* Delivery info */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Truck className="w-5 h-5 text-brand-600" />
              <h2 className="font-serif text-lg font-semibold text-brand-900">Delivery Information</h2>
              {user && <span className="ml-auto text-xs text-forest-600 font-medium">✓ Auto-filled from your account</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-brand-700 mb-1.5 block">Full Name</label>
                <input value={customer.fullName} onChange={(e) => update('fullName', e.target.value)} className="input-field" placeholder="John Doe" />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-brand-700 mb-1.5 block">Email</label>
                <input type="email" value={customer.email} onChange={(e) => update('email', e.target.value)} className="input-field" placeholder="john@example.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-brand-700 mb-1.5 block">Phone</label>
                <input type="tel" value={customer.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" placeholder="9876543210" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Address & Compulsory Map Pin */}
          <div id="checkout-map-card" className={`card p-6 transition-all duration-300 ${mapError ? 'ring-2 ring-red-500 bg-red-50/10' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-950 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-forest-700" />
                  <span>Pin Delivery Location on Map</span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    Compulsory *
                  </span>
                </h2>
                <p className="text-xs text-brand-500 mt-0.5">
                  Orders must be pinned on the map so Google Maps can guide the delivery courier directly to your door.
                </p>
              </div>

              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-950 bg-forest-50 hover:bg-forest-100 border border-forest-300 rounded-full px-4 py-2 transition-all shadow-xs shrink-0"
              >
                <Locate className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                <span>{detectingLocation ? 'Detecting GPS...' : 'Use My Current GPS'}</span>
              </button>
            </div>

            {/* GPS Pin Status Indicator */}
            {markerPos ? (
              <div className="mb-4 p-3 rounded-xl bg-forest-50 border border-forest-200 flex items-center justify-between gap-2 text-xs text-forest-900">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-forest-600 shrink-0" />
                  <div>
                    <span className="font-bold">Location Pinned: </span>
                    <span className="font-mono text-forest-700 font-semibold">
                      {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-forest-700 bg-white px-2 py-0.5 rounded-md border border-forest-200">
                  ✓ Verified for Google Maps
                </span>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Compulsory Step: </span>
                  <span>Click or tap anywhere on the map below (or click &quot;Use My Current GPS&quot;) to pin your location before ordering.</span>
                </div>
              </div>
            )}

            {mapError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-xs font-bold text-red-700 flex items-center gap-2">
                <span>{mapError}</span>
              </div>
            )}

            {/* Interactive Leaflet Map */}
            <div className="mb-4 rounded-2xl overflow-hidden border-2 border-brand-200 shadow-sm relative" style={{ height: 280 }}>
              <MapContainer
                center={markerPos || [20.5937, 78.9629]}
                zoom={markerPos ? 16 : 5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapClickHandler onMapClick={handleMapClick} />
                <MapFlyTo coords={flyTo} />
                {markerPos && <Marker position={markerPos} icon={deliveryMarkerIcon} />}
              </MapContainer>
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-brand-200 shadow-sm text-[11px] text-brand-700 flex items-center justify-between pointer-events-none z-[1000]">
                <span>👉 Click on the map to set or refine your delivery pin</span>
                {markerPos && <span className="font-mono text-forest-700 font-bold">GPS Locked</span>}
              </div>
            </div>

            {/* Address search */}
            <div className="relative mb-4">
              <label className="text-xs font-semibold text-brand-700 mb-1.5 block">Search area / locality to move map</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  value={addressSearch}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Type colony, landmark, or street name to search..."
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-xl ring-1 ring-brand-200 overflow-hidden max-h-56 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-2.5 text-xs text-brand-800 hover:bg-cream-100 transition-colors border-b border-brand-50 last:border-0"
                    >
                      <span className="font-bold text-sm block">{s.main}</span>
                      <span className="text-brand-500 text-[11px] block truncate">{s.secondary}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-brand-100">
              <div>
                <label className="text-xs font-semibold text-brand-700 mb-1.5 block">
                  Flat / House / Door / Building No.
                </label>
                <input
                  value={customer.doorNo || ''}
                  onChange={(e) => update('doorNo', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Flat 302, Sai Residency"
                />
                <p className="text-[11px] text-brand-400 mt-1">Specific flat or building number for courier delivery.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-700 mb-1.5 block">
                  Street / Area / Landmark *
                </label>
                <input
                  value={customer.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="input-field"
                  placeholder="Street or area name (autofilled from map)"
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-700 mb-1.5 block">City *</label>
                <input
                  value={customer.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="input-field"
                  placeholder="City"
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-700 mb-1.5 block">State *</label>
                <select
                  value={customer.state}
                  onChange={(e) => update('state', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-700 mb-1.5 block">PIN Code *</label>
                <input
                  value={customer.pincode}
                  onChange={(e) => update('pincode', e.target.value)}
                  className="input-field"
                  placeholder="6-digit PIN code"
                  maxLength={6}
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-700 mb-1.5 block">Delivery Notes (optional)</label>
                <textarea
                  value={customer.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="e.g. Ring bell twice, leave with security guard"
                />
              </div>
            </div>
          </div>

          {/* Payment — COD only */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-brand-600" />
              <h2 className="font-serif text-lg font-semibold text-brand-900">Payment Method</h2>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-brand-500 bg-brand-50 p-4">
              <div className="w-5 h-5 rounded-full border-2 border-brand-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-900">Cash on Delivery</div>
                <div className="text-xs text-brand-500">Pay when you receive your order</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-lg font-semibold text-brand-900 mb-5">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="relative shrink-0">
                    <img src={item.image} alt={item.grade} className="w-14 h-14 rounded-lg object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-600 text-cream-50 text-[10px] font-bold flex items-center justify-center">
                      {item.count}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-brand-900">{item.grade} {item.type}</div>
                    <div className="text-xs text-brand-500">{item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-brand-900">{formatPrice(item.price * item.count)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-600">Subtotal</span>
                <span className="font-medium text-brand-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-600">Shipping</span>
                <span className="font-medium text-brand-900">
                  {shipping === 0 ? <span className="text-forest-600">Free</span> : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-200">
                <span className="font-serif text-base font-semibold text-brand-900">Total</span>
                <span className="font-serif text-xl font-bold text-brand-900">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={placing}
              className="w-full mt-5 flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-semibold text-cream-50 transition-all hover:bg-brand-700 hover:shadow-lg active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Fullscreen Luxury Order Processing Modal */}
      {placing && (
        <div className="fixed inset-0 z-[9999] bg-brand-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center shadow-2xl border border-brand-200 space-y-6 animate-scale-in">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-brand-100 border-t-brand-700 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="w-8 h-8 text-brand-800 animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-950">
                Registering Your Order
              </h2>
              <p className="text-xs text-brand-600 mt-1">
                Please wait while we log your order and verify warehouse allocation...
              </p>
            </div>

            <div className="space-y-2.5 text-left bg-cream-50 p-4 rounded-2xl border border-brand-200/70 text-xs">
              <div className="flex items-center gap-2 text-forest-800 font-semibold">
                <Check className="w-4 h-4 text-forest-600 shrink-0" />
                <span>Harvest caliber & cashew packs reserved</span>
              </div>
              <div className="flex items-center gap-2 text-forest-800 font-semibold">
                <Check className="w-4 h-4 text-forest-600 shrink-0" />
                <span>Exact GPS delivery coordinates locked</span>
              </div>
              <div className="flex items-center gap-2 text-brand-700 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
                <span>Generating invoice & courier dispatch docket...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
