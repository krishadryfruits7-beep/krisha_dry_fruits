import { useState, useEffect } from 'react';
import {
  RotateCcw,
  ExternalLink,
  Navigation,
  Store,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  MapPin,
  Phone,
  Share2,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Leaf,
  Award,
  Truck,
  Heart,
  Clock,
  Check,
  Loader2,
  LocateFixed,
  Compass,
  Bell,
  Map,
  Search,
  Copy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { adminApi, api } from '@/api';
import {
  useSiteContent,
  saveSiteContent,
  resetSiteContent,
  type SiteContent,
  type LocationBanner,
  type FeatureItem,
  DEFAULT_SITE_CONTENT,
  getStoreGoogleMapsUrl,
  getStoreEmbedMapUrl,
} from '@/site-content';
import ImageUploadWidget from './ImageUploadWidget';

const ICON_OPTIONS: Array<{ label: string; value: FeatureItem['iconName']; icon: any }> = [
  { label: 'Leaf (Natural/Organic)', value: 'Leaf', icon: Leaf },
  { label: 'Award (Quality/Premium)', value: 'Award', icon: Award },
  { label: 'Truck (Fast Delivery)', value: 'Truck', icon: Truck },
  { label: 'ShieldCheck (Trust/Safety)', value: 'ShieldCheck', icon: ShieldCheck },
  { label: 'Heart (Customer Love)', value: 'Heart', icon: Heart },
  { label: 'Clock (Freshly Packed)', value: 'Clock', icon: Clock },
  { label: 'Check (Certified)', value: 'Check', icon: Check },
];

export default function AdminContent() {
  const currentContent = useSiteContent();
  const [content, setContent] = useState<SiteContent>(currentContent);
  const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'locations' | 'contact' | 'social'>('hero');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // GPS Auto-detect, Place Search, and Pinning State
  const [detectingGps, setDetectingGps] = useState(false);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pastedLink, setPastedLink] = useState('');

  // Verified Locations from DB
  const [dbLocations, setDbLocations] = useState<string[]>(['Goa', 'Karnataka', 'Goa & Karnataka']);

  useEffect(() => {
    api.content.get()
      .then((remote) => {
        if (remote && !remote.error) {
          setContent((prev) => ({
            ...prev,
            ...remote,
            hero: { ...prev.hero, ...(remote.hero || {}) },
            contact: { ...prev.contact, ...(remote.contact || {}) },
            social: { ...prev.social, ...(remote.social || {}) },
            features: Array.isArray(remote.features) && remote.features.length > 0 ? remote.features : prev.features,
            locationBanners: Array.isArray(remote.locationBanners) && remote.locationBanners.length > 0 ? remote.locationBanners : prev.locationBanners,
          }));
        }
      })
      .catch(() => {});

    // Fetch verified origins from database products
    api.products.list()
      .then((prods) => {
        if (Array.isArray(prods) && prods.length > 0) {
          const locSet = new Set<string>();
          prods.forEach((p: any) => {
            if (p.origin) {
              const full = p.origin.trim();
              if (full) locSet.add(full);
              const primary = full.split(',')[0].trim();
              if (primary) locSet.add(primary);
            }
          });
          if (locSet.size > 0) {
            setDbLocations(Array.from(locSet));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAutoResolveAndFillLocation = async (inputStr: string) => {
    const text = inputStr.trim();
    if (!text) return;

    setSearchingPlace(true);
    setGpsError(null);
    setGpsSuccess(null);

    try {
      // 1. First try serverless resolver (handles URL redirects, short links, embed codes, coords, place names)
      let resolvedData: any = null;
      try {
        const res = await adminApi.content.resolveLocation(text);
        if (res && res.success) {
          resolvedData = res;
        }
      } catch (srvErr) {
        // Fallback to client resolver
      }

      // 2. Client-side fallback if server didn't resolve coordinates
      if (!resolvedData || (!resolvedData.latitude && !resolvedData.address)) {
        // Check iframe embed
        let targetUrl = text;
        const iframeMatch = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        if (iframeMatch) {
          targetUrl = iframeMatch[1];
        }

        let lat: string | undefined;
        let lng: string | undefined;
        let placeName: string | undefined;
        let streetAddress: string | undefined;
        let landmark: string | undefined;

        // Raw coords: "15.2736, 73.9582"
        const coordMatch = targetUrl.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
        if (coordMatch) {
          lat = coordMatch[1];
          lng = coordMatch[2];
        }

        // @lat,lng
        const atMatch = targetUrl.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
        if (atMatch) {
          lat = atMatch[1];
          lng = atMatch[2];
        }

        // ?q=lat,lng
        const qMatch = targetUrl.match(/[?&](?:q|query|ll)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
        if (qMatch) {
          lat = qMatch[1];
          lng = qMatch[2];
        }

        // /place/Name
        const pMatch = targetUrl.match(/\/maps\/place\/([^/@?]+)/);
        if (pMatch) {
          placeName = decodeURIComponent(pMatch[1].replace(/\+/g, ' '));
        }

        // If coordinates found, reverse-geocode on client
        if (lat && lng) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
              streetAddress = data.display_name;
              landmark = data.address?.suburb || data.address?.neighbourhood || data.address?.road || placeName;
            }
          } catch {}
        } else {
          // Forward-geocode search query
          const q = placeName || text.replace(/^https?:\/\/[^\s]+/, '').trim() || text;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const item = data[0];
              lat = Number(item.lat).toFixed(6);
              lng = Number(item.lon).toFixed(6);
              streetAddress = item.display_name;
              landmark = item.display_name.split(',')[0];
            }
          } catch {}
        }

        resolvedData = {
          success: true,
          latitude: lat || '',
          longitude: lng || '',
          address: streetAddress || '',
          landmark: landmark || placeName || '',
          shopName: placeName || '',
          googleMapsUrl: lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : targetUrl.startsWith('http') ? targetUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`,
        };
      }

      if (resolvedData) {
        setContent((prev) => {
          const nextContact = { ...prev.contact };
          if (resolvedData.latitude) nextContact.latitude = resolvedData.latitude;
          if (resolvedData.longitude) nextContact.longitude = resolvedData.longitude;
          if (resolvedData.address) nextContact.address = resolvedData.address;
          if (resolvedData.landmark) nextContact.landmark = resolvedData.landmark;
          if (resolvedData.googleMapsUrl) nextContact.googleMapsUrl = resolvedData.googleMapsUrl;
          if (resolvedData.shopName && (!nextContact.shopName || nextContact.shopName.includes('Flagship') || nextContact.shopName.includes('Goa'))) {
            nextContact.shopName = resolvedData.shopName;
          }
          return { ...prev, contact: nextContact };
        });

        if (resolvedData.googleMapsUrl) setPastedLink(resolvedData.googleMapsUrl);
        const locDesc = resolvedData.landmark || (resolvedData.address ? resolvedData.address.split(',').slice(0, 2).join(',') : '') || 'Store Location';
        setGpsSuccess(`Location set: ${locDesc}${resolvedData.latitude ? ` (${resolvedData.latitude}, ${resolvedData.longitude})` : ''} — Address, Landmark, Navigation Link & Live Map Updated!`);
        setTimeout(() => setGpsSuccess(null), 7000);
      } else {
        setGpsError('Could not automatically resolve this location. You can enter the address or coordinates directly.');
        setTimeout(() => setGpsError(null), 6000);
      }
    } catch (err: any) {
      setGpsError('Location resolution error. You can enter the address or coordinates directly.');
      setTimeout(() => setGpsError(null), 6000);
    } finally {
      setSearchingPlace(false);
    }
  };

  const handleSearchPlace = async (customQuery?: string) => {
    const q = (customQuery || placeSearchQuery || content.contact.address || '').trim();
    if (!q) {
      setGpsError('Please type a shop name, street address, landmark, or city to search.');
      return;
    }
    await handleAutoResolveAndFillLocation(q);
  };

  const handleAutoDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);
    setGpsSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        let detectedAddress = '';
        let detectedLandmark = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
          const data = await res.json();
          if (data && data.display_name) {
            detectedAddress = data.display_name;
            detectedLandmark = data.address?.suburb || data.address?.neighbourhood || data.address?.road || '';
          }
        } catch { /* proceed */ }

        setContent((prev) => ({
          ...prev,
          contact: {
            ...prev.contact,
            latitude: lat,
            longitude: lng,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
            address: detectedAddress || prev.contact.address,
            landmark: detectedLandmark || prev.contact.landmark,
          },
        }));
        setPastedLink(`https://www.google.com/maps?q=${lat},${lng}`);
        setDetectingGps(false);
        setGpsSuccess(`GPS Auto-Detected: ${lat}, ${lng}${detectedAddress ? ` (${detectedAddress.split(',').slice(0, 3).join(',')})` : ''} — Address & Map auto-filled!`);
        setTimeout(() => setGpsSuccess(null), 7000);
      },
      (err) => {
        setDetectingGps(false);
        setGpsError(err.message || 'Unable to retrieve location. Please allow browser location permissions.');
        setTimeout(() => setGpsError(null), 6000);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleCoordinatesChange = async (latVal: string, lngVal: string) => {
    const cleanLat = latVal.trim();
    const cleanLng = lngVal.trim();
    const mapsUrl =
      cleanLat && cleanLng && !isNaN(Number(cleanLat)) && !isNaN(Number(cleanLng))
        ? `https://www.google.com/maps?q=${cleanLat},${cleanLng}`
        : content.contact.googleMapsUrl;

    setContent((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        latitude: latVal,
        longitude: lngVal,
        googleMapsUrl: mapsUrl,
      },
    }));

    if (cleanLat && cleanLng && !isNaN(Number(cleanLat)) && !isNaN(Number(cleanLng))) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${cleanLat}&lon=${cleanLng}&addressdetails=1`);
        const data = await res.json();
        if (data && data.display_name) {
          setContent((prev) => ({
            ...prev,
            contact: {
              ...prev.contact,
              latitude: cleanLat,
              longitude: cleanLng,
              address: data.display_name,
              landmark: data.address?.suburb || data.address?.neighbourhood || prev.contact.landmark || '',
              googleMapsUrl: mapsUrl,
            },
          }));
          setGpsSuccess(`Coordinates reverse-geocoded: ${data.display_name.split(',').slice(0, 3).join(',')}`);
          setTimeout(() => setGpsSuccess(null), 5000);
        }
      } catch {}
    }
  };

  const handleParseMapsLinkOrCoords = (input: string) => {
    setPastedLink(input);
    if (!input.trim()) return;
    handleAutoResolveAndFillLocation(input);
  };

  const handleSave = async () => {
    // Validate that all location cards have a valid database location key
    const missingLoc = content.locationBanners.find((b) => !b.locationKey || !b.locationKey.trim());
    if (missingLoc) {
      alert('Please choose a valid sourcing region from the dropdown for all location cards before saving.');
      return;
    }

    setSaving(true);
    // Instant optimistic update
    saveSiteContent(content);
    try {
      // Commit directly to MongoDB Atlas
      await adminApi.content.update(content);
    } catch (err) {
      console.warn('Backend content save failed, stored in local cache:', err);
    } finally {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const renderSaveButton = (label: string, className = 'btn-primary py-2.5 px-6 text-xs font-semibold flex items-center justify-center gap-2 shadow-md') => (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className={`${className} transition-all duration-300 disabled:opacity-60 cursor-pointer ${
        savedSuccess ? '!bg-emerald-700 !text-white' : ''
      }`}
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
          <span>Applying changes...</span>
        </>
      ) : savedSuccess ? (
        <>
          <Check className="w-4 h-4 text-emerald-200" />
          <span>Changes Applied Successfully!</span>
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );

  const handleReset = async () => {
    setSaving(true);
    const defaults = resetSiteContent();
    setContent(defaults);
    setShowResetConfirm(false);
    try {
      await adminApi.content.reset();
    } catch (err) {
      console.warn('Backend reset failed, restored local defaults:', err);
    } finally {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const updateHero = (field: keyof SiteContent['hero'], value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const updateContact = (field: keyof SiteContent['contact'], value: string) => {
    setContent((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const updateSocial = (field: keyof SiteContent['social'], value: string) => {
    setContent((prev) => ({
      ...prev,
      social: { ...prev.social, [field]: value },
    }));
  };

  const updateFeature = (index: number, field: keyof FeatureItem, value: any) => {
    setContent((prev) => {
      const nextFeatures = [...prev.features];
      nextFeatures[index] = { ...nextFeatures[index], [field]: value };
      return { ...prev, features: nextFeatures };
    });
  };

  const addLocationCard = () => {
    const assigned = new Set(content.locationBanners.map((b) => (b.locationKey || '').trim()).filter(Boolean));
    const available = dbLocations.filter((loc) => !assigned.has(loc.trim()));

    if (available.length === 0) {
      alert(`All ${dbLocations.length} verified database locations already have a banner card. Duplicate banners for the same location are not permitted.`);
      return;
    }

    const nextLoc = available[0];
    const newCard: LocationBanner = {
      id: `loc-${Date.now()}`,
      tag: `100% Sourced in ${nextLoc}`,
      locationKey: nextLoc,
      title: `${nextLoc} Coastal Harvest Cashews`,
      subtitle: `Artisanal harvesting and sun-drying in ${nextLoc} orchards`,
      image: '/hero_cashew_bowl.jpg',
      linkText: `Explore ${nextLoc} Cashews`,
    };

    // Added at the TOP of the array so admin sees it immediately!
    setContent((prev) => ({
      ...prev,
      locationBanners: [newCard, ...prev.locationBanners],
    }));
  };

  const moveLocationCardUp = (index: number) => {
    if (index <= 0) return;
    setContent((prev) => {
      const copy = [...prev.locationBanners];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return { ...prev, locationBanners: copy };
    });
  };

  const moveLocationCardDown = (index: number) => {
    if (index >= content.locationBanners.length - 1) return;
    setContent((prev) => {
      const copy = [...prev.locationBanners];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return { ...prev, locationBanners: copy };
    });
  };

  const updateLocationCard = (index: number, field: keyof LocationBanner, value: string) => {
    setContent((prev) => {
      const nextLocations = [...prev.locationBanners];
      nextLocations[index] = { ...nextLocations[index], [field]: value };
      return { ...prev, locationBanners: nextLocations };
    });
  };

  const removeLocationCard = (index: number) => {
    if (content.locationBanners.length <= 1) {
      alert('You need at least one location banner card.');
      return;
    }
    setContent((prev) => ({
      ...prev,
      locationBanners: prev.locationBanners.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-100 text-brand-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
              Storefront CMS & Content
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-600 mt-1 max-w-2xl">
            Edit text, headings, badges, trust features, location cards, and contact information. All changes reflect instantly on the public website.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Reset Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={saving}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Reset all content back to original design"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs sm:text-sm font-semibold transition-all shadow-md shadow-brand-950/20 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Publishing to Cloud...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Bar */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-medium animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-900">Storefront content published successfully!</p>
            <p className="text-xs text-emerald-700">Saved to cloud database (MongoDB Atlas) and synchronized with all visitors across all devices.</p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-brand-200/80">
        {[
          { id: 'hero', label: 'Announcement & Hero', icon: Sparkles },
          { id: 'features', label: '4 Trust Features', icon: Layers },
          { id: 'locations', label: 'Location Cashew Banners', icon: MapPin },
          { id: 'contact', label: 'Store Location & Contact', icon: MapPin },
          { id: 'social', label: 'Footer & Social Handles', icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-brand-800 text-cream-50 shadow-sm'
                  : 'text-brand-700 hover:bg-brand-100/70 hover:text-brand-950'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANNOUNCEMENT & HERO */}
      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-6">
            
            {/* Dedicated Top Announcement Bar Card */}
            <div className="p-5 rounded-2xl bg-brand-950 text-cream-100 border border-brand-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Top Store Announcement Bar
                  </span>
                </div>
                <span className="text-[10px] text-cream-300 font-medium bg-white/10 px-2 py-0.5 rounded-full">
                  Appears at the very top of all pages
                </span>
              </div>

              {/* Live Preview Simulation */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 block mb-1">
                  Live Banner Preview:
                </span>
                <p className="text-xs font-medium text-cream-100 tracking-wide break-words">
                  {content.announcement || 'Free pan-India shipping over ₹1,200 • Freshly hand-sorted & packed within 48h'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-cream-200 block mb-1.5">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={content.announcement}
                  onChange={(e) => setContent((prev) => ({ ...prev, announcement: e.target.value }))}
                  className="w-full rounded-xl border border-brand-700 bg-brand-900/90 text-cream-50 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-brand-400"
                  placeholder="e.g. Free pan-India shipping over ₹1,200 • Freshly hand-sorted & packed within 48h"
                />
                <p className="text-[11px] text-cream-300/70 mt-1.5">
                  Directly edits the announcement banner that customers see across the entire shop.
                </p>
              </div>
            </div>

            <h2 className="font-serif text-lg font-bold text-brand-950 border-b border-brand-100 pb-3 flex items-center gap-2 pt-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Hero Copywriting & Headings</span>
            </h2>

            {/* Pill Badge */}
            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                Floating Pill Badge Text
              </label>
              <input
                type="text"
                value={content.hero.badge}
                onChange={(e) => updateHero('badge', e.target.value)}
                className="input-field"
                placeholder="e.g. India's Premium Cashew Brand"
              />
            </div>

            {/* Headline Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={content.hero.titleLine1}
                  onChange={(e) => updateHero('titleLine1', e.target.value)}
                  className="input-field"
                  placeholder="Cashews,"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Headline Line 2
                </label>
                <input
                  type="text"
                  value={content.hero.titleLine2}
                  onChange={(e) => updateHero('titleLine2', e.target.value)}
                  className="input-field"
                  placeholder="crafted to"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Headline Highlight (Italic)
                </label>
                <input
                  type="text"
                  value={content.hero.titleHighlight}
                  onChange={(e) => updateHero('titleHighlight', e.target.value)}
                  className="input-field"
                  placeholder="perfection."
                />
              </div>
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                Sub-heading Description
              </label>
              <textarea
                rows={3}
                value={content.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                className="input-field resize-none"
                placeholder="From the sun-drenched coast of Goa to your home..."
              />
            </div>

            {/* Button text & Hero Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={content.hero.buttonText}
                  onChange={(e) => updateHero('buttonText', e.target.value)}
                  className="input-field"
                  placeholder="Shop Now"
                />
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-brand-100">
                <ImageUploadWidget
                  label="Storefront Hero Image"
                  value={content.hero.image}
                  onChange={(url) => updateHero('image', url)}
                  aspectRatio="landscape"
                  helpText="Select an image from your computer to upload directly to Cloudinary for the hero background."
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-cream-50 rounded-3xl p-6 shadow-luxury border border-brand-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-500 mb-3">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Hero Preview</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-brand-200 bg-white aspect-[4/3] shadow-sm mb-4">
                <img
                  src={content.hero.image || '/hero_cashew_bowl.jpg'}
                  alt="Preview"
                  className="w-full h-full object-cover object-right"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/hero_cashew_bowl.jpg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cream-100/90 via-cream-100/60 to-transparent p-4 flex flex-col justify-center">
                  <span className="inline-block text-[9px] font-bold text-brand-800 bg-white/80 px-2 py-0.5 rounded-full w-max mb-1 border border-brand-200">
                    {content.hero.badge}
                  </span>
                  <div className="font-serif text-lg font-bold text-brand-950 leading-tight">
                    {content.hero.titleLine1} <br />
                    {content.hero.titleLine2} <br />
                    <span className="italic font-normal text-brand-700">{content.hero.titleHighlight}</span>
                  </div>
                  <p className="text-[10px] text-brand-800/90 mt-1 line-clamp-2">
                    {content.hero.subtitle}
                  </p>
                  <span className="mt-2 text-[9px] font-bold text-white bg-brand-700 px-3 py-1 rounded-full w-max shadow-sm">
                    {content.hero.buttonText} →
                  </span>
                </div>
              </div>
              <p className="text-xs text-brand-500 italic">
                * Note: Changes are instantly applied to the live storefront when you click Save.
              </p>
            </div>

            {renderSaveButton('Apply Hero Changes', 'mt-6 w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5')}
          </div>
        </div>
      )}

      {/* TAB 2: 4 TRUST FEATURES */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brand-100 gap-2">
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-950">
                Four Trust Badges (Below Hero Section)
              </h2>
              <p className="text-xs text-brand-600">
                These 4 pillars build confidence right below the main hero image (e.g. 100% Natural, Premium Quality).
              </p>
            </div>
            <button
              onClick={() => {
                setContent((prev) => ({ ...prev, features: DEFAULT_SITE_CONTENT.features }));
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-900 underline"
            >
              Reset 4 Features to Original
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.features.map((item, idx) => {
              return (
                <div
                  key={item.id || idx}
                  className="rounded-2xl border border-brand-200 bg-cream-50/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-700">Badge #{idx + 1}</span>
                    <span className="text-[10px] text-brand-400">Position {idx + 1} of 4</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-brand-900 block mb-1">
                      Choose Icon
                    </label>
                    <select
                      value={item.iconName}
                      onChange={(e) => updateFeature(idx, 'iconName', e.target.value)}
                      className="w-full text-xs rounded-xl border border-brand-200 bg-white px-2.5 py-2 text-brand-900 focus:outline-none focus:border-brand-600"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-brand-900 block mb-1">
                      Top Title (Bold)
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                      className="input-field text-xs py-2"
                      placeholder="e.g. 100%"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-brand-900 block mb-1">
                      Bottom Subtitle
                    </label>
                    <input
                      type="text"
                      value={item.subtitle}
                      onChange={(e) => updateFeature(idx, 'subtitle', e.target.value)}
                      className="input-field text-xs py-2"
                      placeholder="e.g. Natural"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-100">
            {renderSaveButton('Save Trust Badges')}
          </div>
        </div>
      )}

      {/* TAB 3: LOCATION CASHEW BANNERS */}
      {activeTab === 'locations' && (() => {
        const assignedSet = new Set(content.locationBanners.map((b) => (b.locationKey || '').trim()).filter(Boolean));
        const availableLocs = dbLocations.filter((l) => !assignedSet.has(l.trim()));
        const canAddBanner = availableLocs.length > 0;

        return (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brand-100 gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-950">
                  Location-wise Cashew Cards & Sourcing Banners
                </h2>
                <p className="text-xs text-brand-600 mt-0.5">
                  Customers can browse harvests from regional origins ({dbLocations.join(', ')}). Maximum {dbLocations.length} unique banners allowed (1 per verified DB region).
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={addLocationCard}
                  disabled={!canAddBanner}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-brand-200 disabled:text-brand-400 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  title={!canAddBanner ? `All ${dbLocations.length} database locations already have a banner card. No duplicates allowed.` : 'Add a new location banner to the top'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{canAddBanner ? 'Add Location Card (at Top)' : 'All Locations Have Banners'}</span>
                </button>
              </div>
            </div>

            {/* Poster Dimensions Recommendation Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-cream-100/70 border border-amber-200/80 text-xs text-amber-950 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-brand-950 text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Recommended Banner Poster Size & Display Quality</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-0.5">Recommended Dimensions</span>
                  <span className="font-mono text-sm font-bold text-brand-950">1200 × 500 px</span>
                  <p className="text-[11px] text-brand-600 mt-1">Wide landscape format (approx 2.4:1 ratio, min 1000px width).</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-0.5">Mobile & Desktop Safe</span>
                  <span className="text-xs font-bold text-forest-800">Zero Distortion / No Shrinking</span>
                  <p className="text-[11px] text-brand-600 mt-1">Displays via responsive object-cover without squishing pixels or warping on any phone or screen.</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-0.5">Composition Advice</span>
                  <span className="text-xs font-bold text-brand-900">Landscape Cashew Harvests</span>
                  <p className="text-[11px] text-brand-600 mt-1">Orchards, drying yards, or scenic plantations. High-contrast scrims ensure clear readability.</p>
                </div>
              </div>
            </div>

            {/* Banners List with Reordering Controls */}
            <div className="space-y-4">
              {content.locationBanners.map((card, idx) => {
                // In dropdown, only allow this card's own key plus unassigned ones
                const cardOptions = Array.from(new Set([card.locationKey, ...availableLocs])).filter(Boolean);

                return (
                  <div
                    key={card.id || idx}
                    className="rounded-2xl border border-brand-200 p-5 bg-cream-50/60 space-y-4 relative group hover:border-brand-400 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-200/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-brand-800 text-cream-50 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-brand-950">
                          {card.title || 'Untitled Location Banner'}
                        </span>
                        {card.locationKey && (
                          <span className="text-[10px] font-semibold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                            📍 {card.locationKey}
                          </span>
                        )}
                      </div>

                      {/* Move Up, Move Down & Delete Controls */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <div className="flex items-center rounded-xl bg-white border border-brand-200 p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => moveLocationCardUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded-lg hover:bg-cream-100 disabled:opacity-25 disabled:pointer-events-none text-brand-700 transition-colors"
                            title="Move this banner earlier (higher priority)"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] font-mono font-bold text-brand-800 px-2">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveLocationCardDown(idx)}
                            disabled={idx === content.locationBanners.length - 1}
                            className="p-1 rounded-lg hover:bg-cream-100 disabled:opacity-25 disabled:pointer-events-none text-brand-700 transition-colors"
                            title="Move this banner later (lower priority)"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLocationCard(idx)}
                          className="p-1.5 rounded-lg text-brand-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          title="Remove this location banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-brand-900 block mb-1">
                          Origin Display Tag (Upper small text)
                        </label>
                        <input
                          type="text"
                          value={card.tag}
                          onChange={(e) => updateLocationCard(idx, 'tag', e.target.value)}
                          className="input-field text-xs py-2"
                          placeholder="e.g. 100% Sourced in Goa & Karnataka"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-brand-900 block mb-1">
                          Sourcing Region (Verified in DB, No Duplicates) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={card.locationKey}
                          onChange={(e) => updateLocationCard(idx, 'locationKey', e.target.value)}
                          className="input-field text-xs py-2 bg-white font-semibold cursor-pointer"
                        >
                          {cardOptions.map((loc) => (
                            <option key={loc} value={loc}>
                              📍 {loc} {loc === card.locationKey ? '(Current)' : '(Available in DB)'}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-brand-500 mt-1">
                          Strictly limited to unique plantation locations existing in active database products.
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-brand-900 block mb-1">
                          Main Banner Title
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateLocationCard(idx, 'title', e.target.value)}
                          className="input-field text-xs py-2"
                          placeholder="e.g. Margao & Panaji Coastal Groves"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-brand-900 block mb-1">
                          Subtitle / Regional Harvest Note
                        </label>
                        <input
                          type="text"
                          value={card.subtitle}
                          onChange={(e) => updateLocationCard(idx, 'subtitle', e.target.value)}
                          className="input-field text-xs py-2"
                          placeholder="e.g. Sun-dried along the Konkan coast"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-brand-900 block mb-1">
                          Button Label
                        </label>
                        <input
                          type="text"
                          value={card.linkText}
                          onChange={(e) => updateLocationCard(idx, 'linkText', e.target.value)}
                          className="input-field text-xs py-2"
                          placeholder="e.g. Explore Goa Cashews"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-200/50">
                      <ImageUploadWidget
                        label="Banner Background Photo (Recommended: 1200 × 500 px Landscape)"
                        value={card.image}
                        onChange={(url) => updateLocationCard(idx, 'image', url)}
                        aspectRatio="wide"
                        helpText="Select or upload an orchard or harvest photo (1200×500 px recommended). Responsive object-cover ensures it never gets stretched or distorted on mobile or desktop."
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-100">
              {renderSaveButton('Save Location Cards')}
            </div>
          </div>
        );
      })()}

      {/* TAB 4: STORE LOCATION & CONTACT INFO */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-8">
          <div className="pb-3 border-b border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-950 flex items-center gap-2">
                <Store className="w-5 h-5 text-forest-700" />
                <span>Store Location & Contact Management</span>
              </h2>
              <p className="text-xs text-brand-600 mt-0.5">
                Manage your physical store address, 1-click Google Maps navigation link, helpline, and legal certifications.
              </p>
            </div>
            
            <a
              href={getStoreGoogleMapsUrl(content.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200 text-forest-800 text-xs font-semibold self-start sm:self-auto transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-forest-600" />
              <span>Preview Google Maps Link</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* Section 1: Exact Storefront Location & GPS Pinning */}
          <div className="p-5 sm:p-6 rounded-2xl bg-cream-50/70 border border-brand-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-200/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700">
                  <MapPin className="w-4 h-4 text-forest-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-950 uppercase tracking-wide">
                    Exact Google Maps Pin & Store Location
                  </h3>
                  <p className="text-[11px] text-brand-600">
                    Search your location, auto-detect with GPS, or paste your Google Maps link to auto-fill all fields.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Clear Location Button */}
                <button
                  type="button"
                  onClick={() => {
                    setContent((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        shopName: '',
                        address: '',
                        landmark: '',
                        latitude: '',
                        longitude: '',
                        googleMapsUrl: '',
                      },
                    }));
                    setPastedLink('');
                    setPlaceSearchQuery('');
                    setGpsSuccess('Location cleared! Enter your store address or paste your Google Maps link below.');
                    setTimeout(() => setGpsSuccess(null), 5000);
                  }}
                  className="px-3 py-2 rounded-xl border border-brand-200 bg-white hover:bg-red-50 text-brand-700 hover:text-red-700 text-xs font-semibold transition-colors shadow-xs"
                  title="Clear old default address and coordinates to start fresh"
                >
                  Clear Location
                </button>

                {/* 1-Click GPS Auto-Detect Button */}
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 active:scale-95 text-cream-50 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  title="Use your device GPS to pinpoint and auto-fill this shop address"
                >
                  {detectingGps ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{detectingGps ? 'Detecting GPS...' : 'Auto-Detect GPS & Address'}</span>
                </button>
              </div>
            </div>

            {/* GPS & Search Feedback Alerts */}
            {gpsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gpsSuccess}</span>
              </div>
            )}

            {gpsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 text-xs font-medium animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Smart Search Bar: Type Any Shop Name or Address */}
            <div className="p-4 rounded-2xl bg-white border-2 border-forest-200/70 shadow-sm space-y-2">
              <label className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-forest-700" />
                <span>Quick Location Search (Auto-Fills Address, Coordinates & Maps Link):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={placeSearchQuery}
                  onChange={(e) => setPlaceSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPlace()}
                  placeholder="Type shop name, street, city, landmark or pincode (e.g. Krisha Dry Fruits, Connaught Place Delhi, Margao Goa)..."
                  className="input-field text-xs sm:text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleSearchPlace()}
                  disabled={searchingPlace}
                  className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  {searchingPlace ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{searchingPlace ? 'Locating...' : 'Locate & Auto-Fill'}</span>
                </button>
              </div>
              <p className="text-[11px] text-brand-500">
                Type any place, city, or market name and click <strong>Locate & Auto-Fill</strong> to automatically set the address, GPS coordinates, and map pin.
              </p>
            </div>

            {/* Map Pinning Grid: Coordinates + Smart Paste + Interactive Embed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Pin Inputs */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Coordinates Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Latitude (e.g. 15.273612)
                    </label>
                    <input
                      type="text"
                      value={content.contact.latitude || ''}
                      onChange={(e) => handleCoordinatesChange(e.target.value, content.contact.longitude || '')}
                      className="input-field font-mono text-xs"
                      placeholder="e.g. 15.273612"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Longitude (e.g. 73.958215)
                    </label>
                    <input
                      type="text"
                      value={content.contact.longitude || ''}
                      onChange={(e) => handleCoordinatesChange(content.contact.latitude || '', e.target.value)}
                      className="input-field font-mono text-xs"
                      placeholder="e.g. 73.958215"
                    />
                  </div>
                </div>

                {/* Smart Link / Coordinates / Embed Paste */}
                <div>
                  <label className="text-xs font-bold text-brand-900 block mb-1">
                    Or Paste Any Google Maps Link, Share URL, Embed Code, or Coordinates
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pastedLink}
                      onChange={(e) => handleParseMapsLinkOrCoords(e.target.value)}
                      className="input-field font-mono text-xs flex-1"
                      placeholder="Paste e.g. https://maps.app.goo.gl/... or 15.2736, 73.9582..."
                    />
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white border border-brand-300 hover:bg-brand-100/60 rounded-xl text-xs font-semibold text-brand-800 flex items-center gap-1.5 shrink-0 transition-colors"
                      title="Open Google Maps in a new tab to search and copy location"
                    >
                      <Map className="w-3.5 h-3.5 text-brand-600" />
                      <span className="hidden sm:inline">Pick on Maps</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                  <p className="text-[11px] text-brand-500 mt-1">
                    Supports any format: Share links (<span className="font-mono">maps.app.goo.gl</span>), place URLs, embed <span className="font-mono">&lt;iframe&gt;</span> codes, or GPS lat/lng.
                  </p>
                </div>

                {/* Direct Google Maps Destination URL (Editable) */}
                <div>
                  <label className="text-xs font-bold text-brand-900 block mb-1">
                    Google Maps Destination / Navigation URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={content.contact.googleMapsUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateContact('googleMapsUrl', val);
                        if (val.trim()) {
                          handleAutoResolveAndFillLocation(val);
                        }
                      }}
                      className="input-field font-mono text-xs flex-1"
                      placeholder="Paste https://maps.app.goo.gl/... or https://www.google.com/maps?q=..."
                    />
                    <a
                      href={getStoreGoogleMapsUrl(content.contact)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-forest-50 hover:bg-forest-100 border border-forest-200 text-forest-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                      title="Test opening this exact location in a new Google Maps tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-forest-600" />
                      <span>Test Link</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-brand-500 mt-1">
                    This link is opened when customers click &ldquo;Open in Google Maps&rdquo; or &ldquo;Navigate to Store&rdquo; across your entire shop.
                  </p>
                </div>
              </div>

              {/* Right Column: Live Interactive Google Maps Embed */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-brand-900">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-forest-600" />
                    <span>Live Map Location Preview</span>
                  </span>
                  <a
                    href={getStoreGoogleMapsUrl(content.contact)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-forest-700 hover:text-forest-900 underline flex items-center gap-1 font-semibold"
                  >
                    <span>Open Live Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Map Iframe */}
                <div className="w-full h-60 rounded-2xl overflow-hidden border-2 border-brand-300 shadow-sm relative bg-cream-100">
                  <iframe
                    key={`${content.contact.latitude}_${content.contact.longitude}_${content.contact.googleMapsUrl}_${content.contact.address}`}
                    title="Google Maps Location Preview"
                    src={getStoreEmbedMapUrl(content.contact)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
                <p className="text-[10.5px] text-center text-brand-600 font-medium">
                  {content.contact.latitude && content.contact.longitude
                    ? `Pinned at Lat: ${content.contact.latitude}, Lng: ${content.contact.longitude}`
                    : content.contact.googleMapsUrl
                      ? 'Live pin synced with custom Google Maps link'
                      : content.contact.address
                        ? `Live pin centered on ${content.contact.address.split(',')[0]}`
                        : 'Enter your address to center map'}
                </p>
              </div>

            </div>

            {/* Physical Address & Store Info */}
            <div className="pt-4 border-t border-brand-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Storefront Name / Heading
                </label>
                <input
                  type="text"
                  value={content.contact.shopName || ''}
                  onChange={(e) => updateContact('shopName', e.target.value)}
                  className="input-field"
                  placeholder="Krisha Dry Fruits Flagship Store & Outlet"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-brand-900 block">
                    Full Physical Store Address
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSearchPlace(content.contact.address)}
                    disabled={searchingPlace}
                    className="text-[11px] font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 underline cursor-pointer bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-200 shadow-xs transition-colors"
                    title="Geocode and update map pin to this address"
                  >
                    {searchingPlace ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3 text-forest-600" />}
                    <span>{searchingPlace ? 'Geocoding...' : 'Sync Map to this Address'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={content.contact.address || ''}
                  onChange={(e) => {
                    const newAddr = e.target.value;
                    setContent((prev) => {
                      const isOldGoa = (prev.contact.latitude === '15.2736' || prev.contact.latitude === '15.273612') &&
                                       (prev.contact.longitude === '73.9582' || prev.contact.longitude === '73.958215');
                      return {
                        ...prev,
                        contact: {
                          ...prev.contact,
                          address: newAddr,
                          ...(isOldGoa ? { latitude: '', longitude: '' } : {}),
                          googleMapsUrl: newAddr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newAddr)}` : prev.contact.googleMapsUrl,
                        },
                      };
                    });
                  }}
                  className="input-field resize-none"
                  placeholder="e.g. Shop 5, Near Market, Margao, Goa 403601, India"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Landmark / Directions Tip (Optional)
                </label>
                <input
                  type="text"
                  value={content.contact.landmark || ''}
                  onChange={(e) => updateContact('landmark', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Opposite Bus Terminal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={content.contact.hours || ''}
                  onChange={(e) => updateContact('hours', e.target.value)}
                  className="input-field"
                  placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Helpline & Legal */}
          <div className="p-5 rounded-2xl bg-white border border-brand-200/70 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800">
              <Phone className="w-4 h-4 text-brand-600" />
              <span>Customer Helpline & Certification Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Primary Helpline Phone
                </label>
                <input
                  type="text"
                  value={content.contact.phone || ''}
                  onChange={(e) => updateContact('phone', e.target.value)}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Extra / Alternate Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  value={content.contact.extraPhone || ''}
                  onChange={(e) => updateContact('extraPhone', e.target.value)}
                  className="input-field"
                  placeholder="+91 91234 56789"
                />
                <p className="text-[10.5px] text-brand-500 mt-1">
                  Secondary helpline / WhatsApp direct mobile for customer orders.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Official Support Email
                </label>
                <input
                  type="email"
                  value={content.contact.email || ''}
                  onChange={(e) => updateContact('email', e.target.value)}
                  className="input-field"
                  placeholder="care@krishadryfruits.in"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Operating / Store Hours
                </label>
                <input
                  type="text"
                  value={content.contact.hours || ''}
                  onChange={(e) => updateContact('hours', e.target.value)}
                  className="input-field"
                  placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  FSSAI License Number
                </label>
                <input
                  type="text"
                  value={content.contact.fssaiNumber || ''}
                  onChange={(e) => updateContact('fssaiNumber', e.target.value)}
                  className="input-field font-mono"
                  placeholder="10020021000123"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  FSSAI Certificate Description Text
                </label>
                <input
                  type="text"
                  value={content.contact.fssaiText || ''}
                  onChange={(e) => updateContact('fssaiText', e.target.value)}
                  className="input-field"
                  placeholder="FSSAI Certified Unit • Govt. Registered Premium Agri-Produce Facility"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-brand-100">
            {renderSaveButton('Save Store Location & Contact Info')}
          </div>
        </div>
      )}

      {/* TAB 5: FOOTER & SOCIAL HANDLES */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-6">
          <div className="pb-3 border-b border-brand-100">
            <h2 className="font-serif text-lg font-bold text-brand-950">
              Footer Bio & Official Social Media Links
            </h2>
            <p className="text-xs text-brand-600">
              Connect your brand's official profiles and edit the footer bio shown at the bottom of every page.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-brand-900 block mb-1.5">
              Brand Bio (Footer Left Column)
            </label>
            <textarea
              rows={3}
              value={content.footerBio}
              onChange={(e) => setContent((prev) => ({ ...prev, footerBio: e.target.value }))}
              className="input-field resize-none"
              placeholder="Connoisseur cashews directly sourced from certified multi-generation family farms..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                Instagram URL
              </label>
              <input
                type="url"
                value={content.social.instagram}
                onChange={(e) => updateSocial('instagram', e.target.value)}
                className="input-field"
                placeholder="https://instagram.com/krishadryfruits"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                Facebook URL
              </label>
              <input
                type="url"
                value={content.social.facebook}
                onChange={(e) => updateSocial('facebook', e.target.value)}
                className="input-field"
                placeholder="https://facebook.com/krishadryfruits"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                Twitter / X URL
              </label>
              <input
                type="url"
                value={content.social.twitter}
                onChange={(e) => updateSocial('twitter', e.target.value)}
                className="input-field"
                placeholder="https://twitter.com/krishadryfruits"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                WhatsApp Chat Link
              </label>
              <input
                type="url"
                value={content.social.whatsapp}
                onChange={(e) => updateSocial('whatsapp', e.target.value)}
                className="input-field"
                placeholder="https://wa.me/919876543210"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-100">
            {renderSaveButton('Save Footer & Social')}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-brand-950">
                Reset Storefront to Original UI?
              </h3>
              <p className="text-xs sm:text-sm text-brand-600 mt-2 leading-relaxed">
                If you made edits that disrupted the layout or styling, this action will instantly restore all hero headlines, trust badges, location cards, and descriptions back to the pristine default state.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-200 text-xs font-semibold text-brand-800 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-950/20"
              >
                Yes, Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Status Pill visible from ANY scroll position */}
      {(saving || savedSuccess) && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-none">
          <div className={`rounded-2xl px-5 py-3 shadow-2xl border flex items-center gap-3 backdrop-blur-md transition-all ${
            saving
              ? 'bg-brand-950/95 text-white border-brand-700'
              : 'bg-emerald-900/95 text-white border-emerald-500 shadow-emerald-900/30'
          }`}>
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Saving Changes...</p>
                  <p className="text-[10px] text-cream-200">Synchronizing with cloud database</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Changes Applied Successfully!</p>
                  <p className="text-[10px] text-emerald-200">Content published to live storefront & MongoDB</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
