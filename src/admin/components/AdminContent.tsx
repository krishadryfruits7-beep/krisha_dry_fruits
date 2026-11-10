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
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  ArrowRight,
  Calculator,
  Sliders,
  Info,
} from 'lucide-react';
import { adminApi, api } from '@/api';
import {
  useSiteContent,
  saveSiteContent,
  resetSiteContent,
  type SiteContent,
  type LocationBanner,
  type HeroSlide,
  type FeatureItem,
  type DeliverySettings,
  type CategoryBannerItem,
  DEFAULT_SITE_CONTENT,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_CATEGORY_BANNERS,
  calculateDeliveryFee,
  getStoreGoogleMapsUrl,
  getStoreEmbedMapUrl,
  extractCoordinatesFromMapsUrl,
} from '@/site-content';
import ImageUploadWidget from './ImageUploadWidget';
import CategoryMultiSelect from './CategoryMultiSelect';
import { getAllCategories } from '@/categories-storage';

const ICON_OPTIONS: Array<{ label: string; value: FeatureItem['iconName']; icon: any }> = [
  { label: 'Leaf (Natural/Organic)', value: 'Leaf', icon: Leaf },
  { label: 'Award (Quality/Premium)', value: 'Award', icon: Award },
  { label: 'Truck (Fast Delivery)', value: 'Truck', icon: Truck },
  { label: 'ShieldCheck (Trust/Safety)', value: 'ShieldCheck', icon: ShieldCheck },
  { label: 'Heart (Customer Love)', value: 'Heart', icon: Heart },
  { label: 'Clock (Freshly Packed)', value: 'Clock', icon: Clock },
  { label: 'Check (Certified)', value: 'Check', icon: Check },
];

export type ContentTab = 'hero' | 'categories' | 'features' | 'locations' | 'contact' | 'delivery' | 'social';

interface AdminContentProps {
  initialTab?: ContentTab;
}

export default function AdminContent({ initialTab }: AdminContentProps = {}) {
  const currentContent = useSiteContent();
  const [content, setContent] = useState<SiteContent>(currentContent);
  const [activeTab, setActiveTab] = useState<ContentTab>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as ContentTab;
      const subtabParam = searchParams.get('subtab') as ContentTab;
      const valid: ContentTab[] = ['hero', 'categories', 'features', 'locations', 'contact', 'delivery', 'social'];
      if (tabParam && valid.includes(tabParam)) return tabParam;
      if (subtabParam && valid.includes(subtabParam)) return subtabParam;
    }
    return 'hero';
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Delivery KM Pricing Sandbox Simulation State
  const [simDistance, setSimDistance] = useState<number>(8);
  const [simSubtotal, setSimSubtotal] = useState<number>(1500);

  // GPS Auto-detect, Place Search, and Pinning State
  const [detectingGps, setDetectingGps] = useState(false);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pastedLink, setPastedLink] = useState('');

  // Hero Carousel Modal & Preview State
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [editingHeroIndex, setEditingHeroIndex] = useState<number | null>(null);
  const [heroForm, setHeroForm] = useState<HeroSlide>({
    id: '',
    badge: "India's Premium Cashew Brand",
    titleLine1: 'Cashews,',
    titleLine2: 'crafted to',
    titleHighlight: 'perfection.',
    subtitle: 'From the sun-drenched coast of Goa to your home — hand-sorted, freshly packed, and available in hand-curated premium grades.',
    buttonText: 'Shop Now',
    image: '/hero_cashew_bowl.jpg',
  });
  const [previewHeroIdx, setPreviewHeroIdx] = useState(0);

  // Location Banner Pop-up Modal State
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);
  const [bannerForm, setBannerForm] = useState<LocationBanner>({
    id: '',
    tag: '',
    locationKey: '',
    title: '',
    subtitle: '',
    image: '',
    linkText: '',
  });

  // Showcase Card Modal State
  const [showcaseModalOpen, setShowcaseModalOpen] = useState(false);
  const [editingShowcaseIndex, setEditingShowcaseIndex] = useState<number | null>(null);
  const [showcaseForm, setShowcaseForm] = useState<CategoryBannerItem>({
    id: '',
    categoryId: 'nuts',
    title: '',
    subtitle: '',
    image: '',
  });

  const openAddShowcaseModal = () => {
    setEditingShowcaseIndex(null);
    setShowcaseForm({
      id: `showcase-${Date.now()}`,
      categoryId: 'nuts',
      title: '',
      subtitle: '',
      image: '',
    });
    setShowcaseModalOpen(true);
  };

  const openEditShowcaseModal = (index: number) => {
    const list = content.categoryBanners || DEFAULT_CATEGORY_BANNERS;
    const item = list[index];
    if (!item) return;
    setEditingShowcaseIndex(index);
    setShowcaseForm({ ...item });
    setShowcaseModalOpen(true);
  };

  const saveShowcaseModal = () => {
    if (!showcaseForm.title.trim()) {
      showToast('Please enter a title for the showcase card.', 'error');
      return;
    }
    if (!showcaseForm.image.trim()) {
      showToast('Please upload or provide an image for the showcase card.', 'error');
      return;
    }

    setContent((prev) => {
      const list = [...(prev.categoryBanners || DEFAULT_CATEGORY_BANNERS)];
      if (editingShowcaseIndex !== null && editingShowcaseIndex >= 0 && editingShowcaseIndex < list.length) {
        list[editingShowcaseIndex] = showcaseForm;
      } else {
        list.push(showcaseForm);
      }
      const updated = { ...prev, categoryBanners: list };
      saveSiteContent(updated);
      adminApi.content.update(updated).catch(() => {});
      return updated;
    });

    setShowcaseModalOpen(false);
    showToast(
      editingShowcaseIndex !== null
        ? 'Showcase card updated and published live!'
        : 'New showcase card added and published live!',
      'success'
    );
  };

  // Modern In-App Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Interactive Map Spot Picker State
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [spotSearchQuery, setSpotSearchQuery] = useState('');
  const [searchingSpot, setSearchingSpot] = useState(false);
  const [spotCandidates, setSpotCandidates] = useState<Array<{ lat: string; lon: string; display_name: string }>>([]);
  const [pickedSpot, setPickedSpot] = useState<{ lat: string; lng: string; address?: string } | null>(null);

  // Verified Locations from DB
  const [dbLocations, setDbLocations] = useState<string[]>(['Goa', 'Karnataka', 'Goa & Karnataka']);

  useEffect(() => {
    api.content.get()
      .then((remote) => {
        if (remote && !remote.error) {
          setContent((prev) => {
            const resolvedHeroSlides = Array.isArray(remote.heroSlides) && remote.heroSlides.length > 0
              ? remote.heroSlides
              : (Array.isArray(prev.heroSlides) && prev.heroSlides.length > 0
                ? prev.heroSlides
                : [{ id: 'hero-1', ...(remote.hero || prev.hero) }]);

            return {
              ...prev,
              ...remote,
              hero: { ...prev.hero, ...(remote.hero || {}) },
              heroSlides: resolvedHeroSlides,
              categoryBanners: Array.isArray(remote.categoryBanners) ? remote.categoryBanners : prev.categoryBanners,
              contact: { ...prev.contact, ...(remote.contact || {}) },
              delivery: { ...DEFAULT_SITE_CONTENT.delivery, ...(prev.delivery || {}), ...(remote.delivery || {}) },
              social: { ...prev.social, ...(remote.social || {}) },
              features: Array.isArray(remote.features) && remote.features.length > 0 ? remote.features : prev.features,
              locationBanners: Array.isArray(remote.locationBanners) ? remote.locationBanners : prev.locationBanners,
            };
          });
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

        // Use standard coordinates extractor (handles !3d!4d, !2d!3d, @lat,lng, ?q=lat,lng)
        const coords = extractCoordinatesFromMapsUrl(targetUrl);
        if (coords) {
          lat = Number(coords.lat).toFixed(6);
          lng = Number(coords.lng).toFixed(6);
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
          // Auto-fill physical address if empty or still set to default Goa address
          if (resolvedData.address && (!prev.contact.address || !prev.contact.address.trim() || prev.contact.address.includes('123 Plantation Road'))) {
            nextContact.address = resolvedData.address;
          }
          if (resolvedData.landmark) nextContact.landmark = resolvedData.landmark;
          if (resolvedData.googleMapsUrl) nextContact.googleMapsUrl = resolvedData.googleMapsUrl;
          if (resolvedData.shopName && (!nextContact.shopName || nextContact.shopName.includes('Flagship') || nextContact.shopName.includes('Goa'))) {
            nextContact.shopName = resolvedData.shopName;
          }
          return { ...prev, contact: nextContact };
        });

        if (resolvedData.googleMapsUrl) setPastedLink(resolvedData.googleMapsUrl);
        const locDesc = resolvedData.landmark || resolvedData.shopName || 'Store Location';
        setGpsSuccess(`Map Pin updated: ${locDesc}${resolvedData.latitude ? ` (${resolvedData.latitude}, ${resolvedData.longitude})` : ''} — Navigation Link & Live Map Centered!`);
        setTimeout(() => setGpsSuccess(null), 7000);
      } else {
        setGpsError('Could not automatically resolve this location. You can enter the coordinates or map link directly.');
        setTimeout(() => setGpsError(null), 6000);
      }
    } catch (err: any) {
      setGpsError('Location resolution error. You can enter coordinates or a maps embed directly.');
      setTimeout(() => setGpsError(null), 6000);
    } finally {
      setSearchingPlace(false);
    }
  };

  const handleSearchPlace = async (customQuery?: string) => {
    const q = (customQuery || placeSearchQuery || '').trim();
    if (!q) {
      setGpsError('Please type a place name, street, or city to search on map.');
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

        setContent((prev) => ({
          ...prev,
          contact: {
            ...prev.contact,
            latitude: lat,
            longitude: lng,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          },
        }));
        setPastedLink(`https://www.google.com/maps?q=${lat},${lng}`);
        setDetectingGps(false);
        setGpsSuccess(`GPS Auto-Detected: ${lat}, ${lng} — Live Map & Navigation pin updated! (Physical address left unchanged)`);
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

  const handleCoordinatesChange = (latVal: string, lngVal: string) => {
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
      setGpsSuccess(`GPS Coordinates updated: ${cleanLat}, ${cleanLng}. Map pin centered!`);
      setTimeout(() => setGpsSuccess(null), 4000);
    }
  };

  const handleParseMapsLinkOrCoords = (input: string) => {
    setPastedLink(input);
    const trimmed = input.trim();
    if (!trimmed) return;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('<iframe') ||
      /^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/.test(trimmed)
    ) {
      handleAutoResolveAndFillLocation(trimmed);
    }
  };

  const handleSearchSpot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = spotSearchQuery.trim();
    if (!q) return;
    setSearchingSpot(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSpotCandidates(data);
        setPickedSpot({
          lat: Number(data[0].lat).toFixed(6),
          lng: Number(data[0].lon).toFixed(6),
          address: data[0].display_name,
        });
      } else {
        showToast('No locations found for this query. Try a nearby landmark or street.', 'error');
      }
    } catch {
      showToast('Could not search location. Please check internet connection.', 'error');
    } finally {
      setSearchingSpot(false);
    }
  };

  const handlePickDeviceGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setPickedSpot({ lat, lng, address: `GPS Coordinates: ${lat}, ${lng}` });
        showToast(`Device GPS Pin acquired: ${lat}, ${lng}`, 'success');
      },
      (err) => {
        showToast(`Could not acquire GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirmSpot = () => {
    if (!pickedSpot) return;
    setContent((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        latitude: pickedSpot.lat,
        longitude: pickedSpot.lng,
        googleMapsUrl: `https://www.google.com/maps?q=${pickedSpot.lat},${pickedSpot.lng}`,
        ...(pickedSpot.address ? { address: pickedSpot.address } : {}),
      },
    }));
    setMapPickerOpen(false);
    showToast(`Store location pinned at ${pickedSpot.lat}, ${pickedSpot.lng}! Click Save Location to publish.`, 'success');
  };

  const handleSave = async () => {
    setSaving(true);
    // Sanitize location banners so empty keys don't block saving
    const sanitizedLocationBanners = (content.locationBanners || []).map((b) => ({
      ...b,
      locationKey: b.locationKey?.trim() || b.title?.trim() || 'Karnataka',
    }));
    const sanitized = {
      ...content,
      locationBanners: sanitizedLocationBanners,
    };

    saveSiteContent(sanitized);
    try {
      await adminApi.content.update(sanitized);
      setContent(sanitized);
      showToast('All storefront content published live to database!', 'success');
    } catch (err) {
      console.warn('Backend content save notice:', err);
      showToast('Saved locally. Cloud sync pending.', 'info');
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
      showToast('Restored default storefront templates.', 'info');
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

  const updateContact = (field: keyof SiteContent['contact'], value: any) => {
    setContent((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const updateDelivery = (field: keyof DeliverySettings, value: any) => {
    setContent((prev) => ({
      ...prev,
      delivery: {
        ...(prev.delivery || DEFAULT_SITE_CONTENT.delivery || DEFAULT_DELIVERY_SETTINGS),
        [field]: value,
      },
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

  // Hero Carousel Modal & Slide Controls
  const currentHeroSlides: HeroSlide[] =
    Array.isArray(content.heroSlides) && content.heroSlides.length > 0
      ? content.heroSlides
      : [
          {
            id: 'hero-1',
            badge: content.hero.badge,
            titleLine1: content.hero.titleLine1,
            titleLine2: content.hero.titleLine2,
            titleHighlight: content.hero.titleHighlight,
            subtitle: content.hero.subtitle,
            buttonText: content.hero.buttonText,
            image: content.hero.image,
          },
        ];

  const openAddHeroSlide = () => {
    setEditingHeroIndex(null);
    setHeroForm({
      id: `hero-${Date.now()}`,
      badge: "India's Premium Cashew Brand",
      titleLine1: 'Pure & Organic,',
      titleLine2: 'handpicked from',
      titleHighlight: 'pristine orchards.',
      subtitle: 'Sun-drenched whole cashew nuts and California almonds, sorted and sealed within 48h of harvest.',
      buttonText: 'Shop Now',
      image: '/hero_cashew_bowl.jpg',
    });
    setHeroModalOpen(true);
  };

  const openEditHeroSlide = (index: number) => {
    const slide = currentHeroSlides[index];
    if (!slide) return;
    setEditingHeroIndex(index);
    setHeroForm({ ...slide });
    setHeroModalOpen(true);
  };

  const handleSaveHeroModal = async (publishLive: boolean = false) => {
    if (!heroForm.titleLine1.trim()) {
      showToast('Please enter Headline Line 1 for the banner.', 'error');
      return;
    }

    let nextSlides: HeroSlide[];
    if (editingHeroIndex === null) {
      nextSlides = [...currentHeroSlides, heroForm];
    } else {
      nextSlides = [...currentHeroSlides];
      nextSlides[editingHeroIndex] = heroForm;
    }

    const first = nextSlides[0];
    const nextContent: SiteContent = {
      ...content,
      heroSlides: nextSlides,
      hero: {
        badge: first.badge,
        titleLine1: first.titleLine1,
        titleLine2: first.titleLine2,
        titleHighlight: first.titleHighlight,
        subtitle: first.subtitle,
        buttonText: first.buttonText,
        image: first.image,
      },
    };

    setContent(nextContent);
    setHeroModalOpen(false);

    if (publishLive) {
      setSaving(true);
      saveSiteContent(nextContent);
      try {
        await adminApi.content.update(nextContent);
        showToast('Hero banner saved and published live to cloud!', 'success');
      } catch (err) {
        showToast('Saved locally. Cloud sync pending.', 'info');
      } finally {
        setSaving(false);
      }
    } else {
      showToast('Hero banner saved. Click "Apply Hero Changes" to publish.', 'success');
    }
  };

  const moveHeroSlideUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...currentHeroSlides];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    const first = copy[0];
    setContent((prev) => ({
      ...prev,
      heroSlides: copy,
      hero: {
        badge: first.badge,
        titleLine1: first.titleLine1,
        titleLine2: first.titleLine2,
        titleHighlight: first.titleHighlight,
        subtitle: first.subtitle,
        buttonText: first.buttonText,
        image: first.image,
      },
    }));
  };

  const moveHeroSlideDown = (index: number) => {
    if (index >= currentHeroSlides.length - 1) return;
    const copy = [...currentHeroSlides];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    const first = copy[0];
    setContent((prev) => ({
      ...prev,
      heroSlides: copy,
      hero: {
        badge: first.badge,
        titleLine1: first.titleLine1,
        titleLine2: first.titleLine2,
        titleHighlight: first.titleHighlight,
        subtitle: first.subtitle,
        buttonText: first.buttonText,
        image: first.image,
      },
    }));
  };

  const removeHeroSlide = (index: number) => {
    if (currentHeroSlides.length <= 1) {
      showToast('Storefront requires at least 1 hero banner.', 'error');
      return;
    }
    const filtered = currentHeroSlides.filter((_, i) => i !== index);
    const first = filtered[0];
    setContent((prev) => ({
      ...prev,
      heroSlides: filtered,
      hero: {
        badge: first.badge,
        titleLine1: first.titleLine1,
        titleLine2: first.titleLine2,
        titleHighlight: first.titleHighlight,
        subtitle: first.subtitle,
        buttonText: first.buttonText,
        image: first.image,
      },
    }));
    showToast('Hero banner removed.', 'info');
  };

  // Location Banner Modal Controls
  const openAddBanner = () => {
    const defaultRegion = dbLocations[0] || 'Goa';
    setEditingBannerIndex(null);
    setBannerForm({
      id: `loc-${Date.now()}`,
      tag: `100% Sourced in ${defaultRegion}`,
      locationKey: defaultRegion,
      title: `${defaultRegion} Coastal Harvest Cashews`,
      subtitle: `Artisanal harvesting and sun-drying in ${defaultRegion} orchards`,
      image: '/hero_cashew_bowl.jpg',
      linkText: `Explore ${defaultRegion} Cashews`,
    });
    setBannerModalOpen(true);
  };

  const openEditBanner = (index: number) => {
    const item = content.locationBanners[index];
    if (!item) return;
    setEditingBannerIndex(index);
    setBannerForm({ ...item });
    setBannerModalOpen(true);
  };

  const handleSaveBannerModal = async (publishLive: boolean = false) => {
    const locKey = (bannerForm.locationKey || '').trim();
    if (!locKey) {
      showToast('Please enter or select a sourcing region name.', 'error');
      return;
    }
    if (!bannerForm.title.trim()) {
      showToast('Please enter a banner title.', 'error');
      return;
    }

    let nextBanners: LocationBanner[];
    if (editingBannerIndex === null) {
      nextBanners = [bannerForm, ...content.locationBanners];
    } else {
      nextBanners = [...content.locationBanners];
      nextBanners[editingBannerIndex] = bannerForm;
    }

    const nextContent = { ...content, locationBanners: nextBanners };
    setContent(nextContent);
    setBannerModalOpen(false);

    if (publishLive) {
      setSaving(true);
      saveSiteContent(nextContent);
      try {
        await adminApi.content.update(nextContent);
        showToast('Location banner saved and published live to cloud!', 'success');
      } catch (err) {
        showToast('Saved locally. Cloud sync pending.', 'info');
      } finally {
        setSaving(false);
      }
    } else {
      showToast('Location banner saved. Click "Save & Publish Live" to publish to cloud.', 'success');
    }
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

  const removeLocationCard = (index: number) => {
    setContent((prev) => ({
      ...prev,
      locationBanners: prev.locationBanners.filter((_, i) => i !== index),
    }));
    showToast('Location banner removed.', 'info');
  };

  const updateCategoryCard = (index: number, patch: Partial<CategoryBannerItem>) => {
    setContent((prev) => {
      const list = [...(prev.categoryBanners || DEFAULT_CATEGORY_BANNERS)];
      list[index] = { ...list[index], ...patch };
      return { ...prev, categoryBanners: list };
    });
  };

  const addCategoryCard = () => {
    openAddShowcaseModal();
  };

  const removeCategoryCard = (index: number) => {
    setContent((prev) => {
      const currentList = prev.categoryBanners || DEFAULT_CATEGORY_BANNERS;
      const list = currentList.filter((_, i) => i !== index);
      const updated = { ...prev, categoryBanners: list };
      saveSiteContent(updated);
      adminApi.content.update(updated).catch(() => {});
      return updated;
    });
    showToast('Showcase card removed and published live.', 'success');
  };

  const moveCategoryCardUp = (index: number) => {
    if (index <= 0) return;
    setContent((prev) => {
      const list = [...(prev.categoryBanners || DEFAULT_CATEGORY_BANNERS)];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return { ...prev, categoryBanners: list };
    });
  };

  const moveCategoryCardDown = (index: number) => {
    const list = content.categoryBanners || DEFAULT_CATEGORY_BANNERS;
    if (index >= list.length - 1) return;
    setContent((prev) => {
      const copy = [...(prev.categoryBanners || DEFAULT_CATEGORY_BANNERS)];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return { ...prev, categoryBanners: copy };
    });
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
          { id: 'categories', label: 'Front Showcase Cards', icon: Layers },
          { id: 'features', label: '4 Trust Features', icon: Award },
          { id: 'contact', label: 'Store Location & Contact', icon: Store },
          { id: 'delivery', label: 'Delivery & KM Pricing', icon: Truck },
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
            
            {/* Store Brand Logo & Header Icon Card */}
            <div className="p-5 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brand-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-brand-100 text-brand-800">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <h3 className="font-serif text-base font-bold text-brand-950">
                      Store Brand Logo & Icon
                    </h3>
                  </div>
                  <p className="text-xs text-brand-600 mt-0.5">
                    Your official brand logo shown in the customer header, footer, customer invoices, and admin navigation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {content.logo && content.logo !== '/Krisha_Dry_Fruits_logo.png' && (
                    <button
                      type="button"
                      onClick={() => setContent((prev) => ({ ...prev, logo: '/Krisha_Dry_Fruits_logo.png' }))}
                      className="text-xs text-brand-600 hover:text-brand-950 underline font-medium"
                    >
                      Reset to Default
                    </button>
                  )}
                  {renderSaveButton('Save Logo', 'btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm')}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-cream-50/70 border border-brand-200">
                {/* Visual Preview */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white ring-2 ring-brand-400/80 shadow-md flex items-center justify-center p-1">
                    <img
                      src={content.logo || '/Krisha_Dry_Fruits_logo.png'}
                      alt="Brand Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
                    Live Preview
                  </span>
                </div>

                {/* Upload & URL Control */}
                <div className="flex-1 space-y-2 w-full">
                  <ImageUploadWidget
                    label="Upload Store Logo (PNG / JPG / WebP)"
                    value={content.logo || '/Krisha_Dry_Fruits_logo.png'}
                    onChange={(url) => setContent((prev) => ({ ...prev, logo: url }))}
                    folder="krisha_dry_fruits/brand"
                  />
                  <p className="text-[11px] text-brand-500">
                    * Recommended: Square format (e.g. 500×500px), with transparent or clean white/cream background.
                  </p>
                </div>
              </div>
            </div>

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                  <p className="text-[11px] text-cream-300/70">
                    Directly edits the announcement banner that customers see across the entire shop.
                  </p>
                  {renderSaveButton('Save Banner', 'bg-amber-500 hover:bg-amber-600 text-brand-950 font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shrink-0')}
                </div>
              </div>
            </div>

            {/* Dedicated Hero Banners & Slider Section */}
            <div className="pt-2 border-t border-brand-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-brand-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>Storefront Hero Banners & Carousel</span>
                  </h2>
                  <p className="text-xs text-brand-600 mt-0.5">
                    {currentHeroSlides.length <= 1
                      ? 'Currently 1 banner active. Indicator dots are hidden on storefront for a clean aesthetic.'
                      : `${currentHeroSlides.length} banners active. Visitors can swipe or click between banners with dynamic indicator dots.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={openAddHeroSlide}
                    className="btn-primary py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Hero Banner</span>
                  </button>
                  {renderSaveButton('Save Carousel', 'btn-outline py-2 px-3 text-xs font-semibold')}
                </div>
              </div>

              {/* List of active Hero Banners */}
              <div className="space-y-3">
                {currentHeroSlides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="p-4 rounded-2xl border border-brand-200/80 bg-cream-50/60 hover:bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="relative w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden border border-brand-200 bg-white shrink-0">
                        <img
                          src={slide.image || '/hero_cashew_bowl.jpg'}
                          alt={slide.titleLine1 || 'Banner'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/hero_cashew_bowl.jpg';
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-bold text-white text-center py-0.5">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Content summary */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 border border-brand-200/60">
                            {idx === 0 ? 'Primary / Default Banner' : `Banner #${idx + 1}`}
                          </span>
                          {slide.badge && (
                            <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200/50 truncate max-w-[150px]">
                              {slide.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-sm font-bold text-brand-950 truncate leading-snug">
                          {slide.titleLine1} {slide.titleLine2} <span className="italic font-normal text-brand-700">{slide.titleHighlight}</span>
                        </h3>

                        <p className="text-[11px] text-brand-700/80 truncate mt-0.5">
                          {slide.subtitle || 'No sub-heading'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => moveHeroSlideUp(idx)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-2 rounded-xl border border-brand-200 bg-white hover:bg-cream-100 text-brand-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => moveHeroSlideDown(idx)}
                        disabled={idx === currentHeroSlides.length - 1}
                        title="Move Down"
                        className="p-2 rounded-xl border border-brand-200 bg-white hover:bg-cream-100 text-brand-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditHeroSlide(idx)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-300 bg-white hover:bg-brand-50 text-brand-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-brand-600" />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeHeroSlide(idx)}
                        disabled={currentHeroSlides.length <= 1}
                        title={currentHeroSlides.length <= 1 ? 'Storefront requires at least 1 hero banner' : 'Delete Banner'}
                        className="p-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-cream-50 rounded-3xl p-6 shadow-luxury border border-brand-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Interactive Live Preview</span>
                </div>
                {currentHeroSlides.length > 1 && (
                  <span className="text-[10px] font-bold text-brand-700 bg-white px-2 py-0.5 rounded-full border border-brand-200">
                    Slide {previewHeroIdx + 1} of {currentHeroSlides.length}
                  </span>
                )}
              </div>

              {/* Simulated Hero Card */}
              {(() => {
                const safeIdx = previewHeroIdx < currentHeroSlides.length ? previewHeroIdx : 0;
                const activePreview = currentHeroSlides[safeIdx] || currentHeroSlides[0];

                return (
                  <div className="relative rounded-2xl overflow-hidden border border-brand-200 bg-white aspect-[4/3] shadow-sm mb-4 group/preview">
                    <img
                      src={activePreview.image || '/hero_cashew_bowl.jpg'}
                      alt="Preview"
                      className="w-full h-full object-cover object-right"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/hero_cashew_bowl.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-cream-100/90 via-cream-100/60 to-transparent p-4 flex flex-col justify-center">
                      {activePreview.badge && (
                        <span className="inline-block text-[9px] font-bold text-brand-800 bg-white/80 px-2 py-0.5 rounded-full w-max mb-1 border border-brand-200">
                          {activePreview.badge}
                        </span>
                      )}
                      <div className="font-serif text-lg font-bold text-brand-950 leading-tight">
                        {activePreview.titleLine1} <br />
                        {activePreview.titleLine2} <br />
                        <span className="italic font-normal text-brand-700">{activePreview.titleHighlight}</span>
                      </div>
                      <p className="text-[10px] text-brand-800/90 mt-1 line-clamp-2">
                        {activePreview.subtitle}
                      </p>
                      <span className="mt-2 text-[9px] font-bold text-white bg-brand-700 px-3 py-1 rounded-full w-max shadow-sm">
                        {activePreview.buttonText || 'Shop Now'} →
                      </span>
                    </div>

                    {/* Interactive Preview Slide Controls if multiple slides */}
                    {currentHeroSlides.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewHeroIdx((prev) => (prev - 1 + currentHeroSlides.length) % currentHeroSlides.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 text-brand-900 shadow-md flex items-center justify-center hover:bg-white cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewHeroIdx((prev) => (prev + 1) % currentHeroSlides.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 text-brand-900 shadow-md flex items-center justify-center hover:bg-white cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Interactive dynamic dots in preview */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
                          {currentHeroSlides.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              onClick={() => setPreviewHeroIdx(dotIdx)}
                              className={`transition-all rounded-full ${
                                dotIdx === safeIdx ? 'w-4 h-1.5 bg-brand-900' : 'w-1.5 h-1.5 bg-brand-400/70'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <p className="text-xs text-brand-500 italic">
                * Note: Changes are instantly applied to the live storefront when you click Apply Hero Changes.
              </p>
            </div>

            {renderSaveButton('Apply Hero Changes', 'mt-6 w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5')}
          </div>
        </div>
      )}

      {/* TAB 2: FRONT SHOWCASE CATEGORY CARDS */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-100 text-brand-800">
                  <Layers className="w-4 h-4" />
                </span>
                <h2 className="font-serif text-xl font-bold text-brand-950">
                  Front Showcase Cards
                </h2>
              </div>
              <p className="text-xs text-brand-600 mt-1 max-w-2xl">
                These are the visual category banner cards placed directly beneath the hero banner on the homepage. Customers tap these cards to instantly filter the store by your chosen collections.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addCategoryCard}
                className="btn-outline py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Showcase Card</span>
              </button>
              {renderSaveButton('Save Cards', 'btn-primary py-2 px-4 text-xs font-semibold')}
            </div>
          </div>

          {/* Cards Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(content.categoryBanners || DEFAULT_CATEGORY_BANNERS).map((card, idx) => (
              <div
                key={card.id || idx}
                className="rounded-2xl border border-brand-200/80 bg-cream-50/50 p-5 space-y-4 hover:shadow-md transition-all relative group"
              >
                {/* Header & Order Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-900 text-cream-50 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-brand-900 truncate max-w-[180px]">
                      {card.title || 'Untitled Card'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveCategoryCardUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded text-brand-600 hover:bg-cream-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move card left / up"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategoryCardDown(idx)}
                      disabled={idx === (content.categoryBanners || DEFAULT_CATEGORY_BANNERS).length - 1}
                      className="p-1 rounded text-brand-600 hover:bg-cream-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move card right / down"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditShowcaseModal(idx)}
                      className="p-1 rounded text-brand-700 hover:bg-cream-200 transition-colors ml-1"
                      title="Edit this card in pop-up modal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategoryCard(idx)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors ml-1"
                      title="Delete this showcase card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Card Preview Box matching Storefront UI */}
                <div className="relative rounded-2xl overflow-hidden border border-brand-200 bg-white shadow-xs">
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-cream-200">
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-brand-400">
                        No Image Set
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white border-t border-brand-100 flex flex-col justify-between">
                    <div>
                      <p className="font-serif text-sm font-bold text-brand-950 leading-tight truncate">{card.title || 'Card Title'}</p>
                      <p className="text-[11px] text-brand-600 truncate mt-0.5">{card.subtitle || 'Card Subtitle'}</p>
                    </div>
                    <div className="mt-2 text-[10px] font-semibold text-brand-800 flex items-center gap-1">
                      <span>Shop Collection</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                {/* Edit Fields */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Card Heading / Title
                    </label>
                    <input
                      value={card.title}
                      onChange={(e) => updateCategoryCard(idx, { title: e.target.value })}
                      className="input-field text-xs py-2 bg-white"
                      placeholder="e.g. Premium Nuts, Dates & Figs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Subtitle / Nut Details
                    </label>
                    <input
                      value={card.subtitle}
                      onChange={(e) => updateCategoryCard(idx, { subtitle: e.target.value })}
                      className="input-field text-xs py-2 bg-white"
                      placeholder="e.g. Almonds, Cashews & Walnuts"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1.5">
                      Included Categories (Select single or multiple)
                    </label>
                    <CategoryMultiSelect
                      selectedIds={(() => {
                        const cats = Array.isArray(card.categoryIds) && card.categoryIds.length > 0
                          ? card.categoryIds
                          : card.categoryId === 'nuts'
                          ? ['almonds', 'cashews', 'walnuts', 'pistachios']
                          : card.categoryId === 'dates-figs'
                          ? ['dates', 'figs']
                          : card.categoryId === 'dried-fruits'
                          ? ['raisins', 'figs']
                          : card.categoryId === 'berries-seeds'
                          ? ['berries-seeds']
                          : card.categoryId === 'gift-boxes'
                          ? ['gift-boxes']
                          : [card.categoryId];
                        return cats.filter(Boolean);
                      })()}
                      onChange={(nextIds) => {
                        updateCategoryCard(idx, {
                          categoryIds: nextIds,
                          categoryId: nextIds[0] || card.categoryId,
                        });
                      }}
                      allCategories={getAllCategories()}
                    />
                    <p className="text-[10px] text-brand-500 mt-1">
                      * When customers tap this card on the home page, products from all chosen categories will be displayed.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Banner Image (Cloudinary or Direct URL)
                    </label>
                    <ImageUploadWidget
                      label="Upload Showcase Banner Photo"
                      value={card.image}
                      onChange={(url) => updateCategoryCard(idx, { image: url })}
                      folder="krisha_dry_fruits/showcase"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-brand-100 flex items-center justify-between">
            <button
              type="button"
              onClick={addCategoryCard}
              className="btn-outline py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Showcase Card</span>
            </button>
            {renderSaveButton('Save Showcase Cards', 'btn-primary py-2.5 px-6 text-xs font-semibold')}
          </div>
        </div>
      )}

      {/* TAB 3: 4 TRUST FEATURES */}
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

                {/* 1-Click Interactive Map Spot Picker */}
                <button
                  type="button"
                  onClick={() => {
                    setPickedSpot({
                      lat: content.contact.latitude || '13.020102',
                      lng: content.contact.longitude || '77.547321',
                      address: content.contact.address || '',
                    });
                    setMapPickerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Pick and spot store location on interactive map"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Spot on Interactive Map</span>
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
                  <span>{detectingGps ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
                </button>

                {renderSaveButton('Save Location & Pin', 'btn-primary py-2 px-4 text-xs font-bold')}
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
                  placeholder="Type shop name, street, city, landmark or pincode (e.g. Krisha Dry Fruits, Yeshwanthpur Bangalore)..."
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

            {/* Map Pinning Grid: Coordinates + Clean Navigation URL + Interactive Embed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Pin Inputs */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Coordinates Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Latitude (e.g. 13.020102)
                    </label>
                    <input
                      type="text"
                      value={content.contact.latitude || ''}
                      onChange={(e) => handleCoordinatesChange(e.target.value, content.contact.longitude || '')}
                      className="input-field font-mono text-xs"
                      placeholder="e.g. 13.020102"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Longitude (e.g. 77.547321)
                    </label>
                    <input
                      type="text"
                      value={content.contact.longitude || ''}
                      onChange={(e) => handleCoordinatesChange(content.contact.latitude || '', e.target.value)}
                      className="input-field font-mono text-xs"
                      placeholder="e.g. 77.547321"
                    />
                  </div>
                </div>

                {/* Google Maps Navigation & Share URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-brand-900">
                      Google Maps Navigation & Share URL
                    </label>
                    <a
                      href={getStoreGoogleMapsUrl(content.contact)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-forest-700 hover:text-forest-900 underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3 text-forest-600" />
                      <span>Preview in Maps</span>
                    </a>
                  </div>
                  <input
                    type="text"
                    value={content.contact.googleMapsUrl || ''}
                    onChange={(e) => {
                      updateContact('googleMapsUrl', e.target.value);
                      handleParseMapsLinkOrCoords(e.target.value);
                    }}
                    onPaste={(e) => {
                      const val = e.clipboardData.getData('text');
                      if (val && val.trim()) {
                        handleAutoResolveAndFillLocation(val.trim());
                      }
                    }}
                    className="input-field font-mono text-xs w-full"
                    placeholder="Paste e.g. https://maps.app.goo.gl/... or coordinates"
                  />
                  <p className="text-[11px] text-brand-500 mt-1">
                    Paste any Google Maps link, share link, or lat/lng — coordinates and address will automatically sync.
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
                    ? `Pinned at GPS: ${content.contact.latitude}, ${content.contact.longitude}`
                    : content.contact.googleMapsUrl
                      ? 'Live pin synced with custom Google Maps link'
                      : 'Paste a Google Maps link or enter coordinates to center map'}
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
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Full Physical Store Address (Display Text on Website & Footer)
                </label>
                <textarea
                  rows={2}
                  value={content.contact.address || ''}
                  onChange={(e) => updateContact('address', e.target.value)}
                  className="input-field resize-none"
                  placeholder="e.g. Shop 5, Near Market, Margao, Goa 403601, India"
                />
                <p className="text-[11px] text-brand-500 mt-1">
                  This text is strictly for visitors to read on your website and footer. It does not alter your Google Maps pin or navigation links.
                </p>
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

              {/* FSSAI Display Toggle */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-cream-50/80 border border-brand-200/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-brand-950 block">Show FSSAI License Badge on Website</span>
                  <span className="text-[11px] text-brand-600 block mt-0.5">
                    Controls whether the FSSAI certification badge and license number are shown on the website footer and product pages.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateContact('showFssai', !(content.contact.showFssai ?? false))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                    content.contact.showFssai ? 'bg-forest-700' : 'bg-brand-300'
                  }`}
                  title="Toggle FSSAI display on website"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      content.contact.showFssai ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  FSSAI License Number <span className="text-brand-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={content.contact.fssaiNumber || ''}
                  onChange={(e) => updateContact('fssaiNumber', e.target.value)}
                  className="input-field font-mono"
                  placeholder="e.g. 10020021000123 (Leave blank to hide)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  FSSAI Certificate Description Text <span className="text-brand-400 font-normal">(Optional)</span>
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

      {/* TAB: DELIVERY & KM PRICING */}
      {activeTab === 'delivery' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-100">
            <div>
              <h2 className="font-serif text-xl font-bold text-brand-950 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-700" />
                <span>Delivery & Distance-Based (KM) Pricing</span>
              </h2>
              <p className="text-xs sm:text-sm text-brand-600 mt-1 max-w-2xl">
                Configure whether delivery fees are automatically calculated based on the customer's distance in kilometers from your shop location, or charged at a flat rate.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {renderSaveButton('Publish Delivery Pricing')}
            </div>
          </div>

          {/* Shop Origin Coordinates Status */}
          {(() => {
            const shopLat = content.contact?.latitude;
            const shopLng = content.contact?.longitude;
            const hasCoords = Boolean(shopLat && shopLng && !isNaN(Number(shopLat)) && !isNaN(Number(shopLng)));

            return (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  hasCoords
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        hasCoords ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                        <span>{hasCoords ? 'Store Origin Pinned & Active' : 'Store Coordinates Missing'}</span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/70 border border-current">
                          {hasCoords ? 'GPS Live' : 'Action Needed'}
                        </span>
                      </h4>
                      <p className="text-xs mt-0.5 opacity-90">
                        {hasCoords
                          ? `Store Origin: ${content.contact?.shopName || 'Krisha Dry Fruits'} (${shopLat}, ${shopLng}). Customer distance is measured accurately from this pin.`
                          : 'You have not yet pinned your store GPS coordinates in the Store Location tab. Distance calculations will fall back to flat rate until coordinates are saved.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white shadow-xs border border-brand-200 text-brand-900 hover:bg-cream-50 transition-colors shrink-0 cursor-pointer"
                  >
                    <span>{hasCoords ? 'Change Store Pin (Location Tab)' : 'Set Store Pin Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Pricing Model Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-brand-900 uppercase tracking-wider block">
              Choose Delivery Pricing Model
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Distance Based (KM) */}
              <div
                onClick={() => updateDelivery('pricingModel', 'km')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  (content.delivery?.pricingModel ?? 'km') === 'km'
                    ? 'border-brand-700 bg-brand-50/60 shadow-sm'
                    : 'border-brand-200/80 bg-white hover:border-brand-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-800">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-brand-950">
                        Distance-Based (KM)
                      </h3>
                      <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                        Recommended
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="pricingModel"
                    checked={(content.delivery?.pricingModel ?? 'km') === 'km'}
                    onChange={() => updateDelivery('pricingModel', 'km')}
                    className="mt-1 text-brand-700 focus:ring-brand-700"
                  />
                </div>
                <p className="text-xs text-brand-600 leading-relaxed">
                  Delivery price scales based on actual distance from your shop pin to the customer's delivery pin on the map. Includes base km, extra km rate, and local radius limit.
                </p>
              </div>

              {/* Option 2: Fixed Flat Rate */}
              <div
                onClick={() => updateDelivery('pricingModel', 'flat')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  (content.delivery?.pricingModel ?? 'km') === 'flat'
                    ? 'border-brand-700 bg-brand-50/60 shadow-sm'
                    : 'border-brand-200/80 bg-white hover:border-brand-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-800">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-brand-950">
                        Fixed Flat Rate
                      </h3>
                      <span className="text-[10px] text-brand-500 font-medium">
                        Standard Pan-India
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="pricingModel"
                    checked={(content.delivery?.pricingModel ?? 'km') === 'flat'}
                    onChange={() => updateDelivery('pricingModel', 'flat')}
                    className="mt-1 text-brand-700 focus:ring-brand-700"
                  />
                </div>
                <p className="text-xs text-brand-600 leading-relaxed">
                  Charges the same fixed shipping fee regardless of how far the customer is located. Useful for standard national courier operations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="p-4 rounded-2xl bg-cream-50/80 border border-brand-200/70 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500 block">
              Quick Preset Configurations
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setContent((prev) => ({
                    ...prev,
                    delivery: {
                      enabled: true,
                      pricingModel: 'km',
                      baseKm: 3,
                      basePrice: 40,
                      pricePerKm: 8,
                      freeDeliveryThreshold: 1500,
                      maxKm: 25,
                      flatOutsideRate: 90,
                      flatRate: 70,
                    },
                  }));
                  showToast('Applied "Hyperlocal City" delivery preset.', 'info');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-brand-200 text-xs font-semibold text-brand-800 hover:bg-cream-100 transition-colors shadow-xs"
              >
                🏙️ Hyperlocal City (Base 3km @ ₹40, +₹8/km)
              </button>

              <button
                type="button"
                onClick={() => {
                  setContent((prev) => ({
                    ...prev,
                    delivery: {
                      enabled: true,
                      pricingModel: 'km',
                      baseKm: 5,
                      basePrice: 50,
                      pricePerKm: 10,
                      freeDeliveryThreshold: 2000,
                      maxKm: 50,
                      flatOutsideRate: 100,
                      flatRate: 80,
                    },
                  }));
                  showToast('Applied "Standard Regional" delivery preset.', 'info');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-brand-200 text-xs font-semibold text-brand-800 hover:bg-cream-100 transition-colors shadow-xs"
              >
                📍 Standard Regional (Base 5km @ ₹50, +₹10/km)
              </button>

              <button
                type="button"
                onClick={() => {
                  setContent((prev) => ({
                    ...prev,
                    delivery: {
                      enabled: true,
                      pricingModel: 'flat',
                      baseKm: 5,
                      basePrice: 50,
                      pricePerKm: 10,
                      freeDeliveryThreshold: 2000,
                      maxKm: 50,
                      flatOutsideRate: 100,
                      flatRate: 80,
                    },
                  }));
                  showToast('Applied "Flat Pan-India" delivery preset.', 'info');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-brand-200 text-xs font-semibold text-brand-800 hover:bg-cream-100 transition-colors shadow-xs"
              >
                📦 Pan-India Flat (Flat ₹80 across India)
              </button>
            </div>
          </div>

          {/* Pricing Parameters Grid */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-700" />
              <span>Pricing Parameters & Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Base Distance (km) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Base Distance Radius (KM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={content.delivery?.baseKm ?? 5}
                    onChange={(e) => updateDelivery('baseKm', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="input-field text-sm font-semibold pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    KM
                  </span>
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Deliveries within this initial radius are charged only the Base Price.
                </p>
              </div>

              {/* Base Price (₹) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Base Delivery Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={content.delivery?.basePrice ?? 50}
                    onChange={(e) => updateDelivery('basePrice', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input-field text-sm font-semibold pl-8"
                  />
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Delivery fee charged for any order up to the base distance.
                </p>
              </div>

              {/* Price Per Extra KM (₹/km) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Price Per Extra KM (₹/KM)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={content.delivery?.pricePerKm ?? 10}
                    onChange={(e) => updateDelivery('pricePerKm', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input-field text-sm font-semibold pl-8 pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    / KM
                  </span>
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Added for every single kilometer beyond the base distance.
                </p>
              </div>

              {/* Free Delivery Threshold (₹) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Free Delivery Threshold (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={content.delivery?.freeDeliveryThreshold ?? 2000}
                    onChange={(e) => updateDelivery('freeDeliveryThreshold', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input-field text-sm font-semibold pl-8"
                  />
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Orders with subtotal equal or above this get 100% Free Shipping. (0 disables).
                </p>
              </div>

              {/* Max Local Radius (km) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Max Local Radius (KM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={content.delivery?.maxKm ?? 50}
                    onChange={(e) => updateDelivery('maxKm', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="input-field text-sm font-semibold pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    KM
                  </span>
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Beyond this distance, the Flat Outside Rate automatically applies.
                </p>
              </div>

              {/* Flat Outside Rate (₹) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Outside Radius Courier Rate (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={content.delivery?.flatOutsideRate ?? 100}
                    onChange={(e) => updateDelivery('flatOutsideRate', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input-field text-sm font-semibold pl-8"
                  />
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Fixed charge for distant orders outside the maximum local radius.
                </p>
              </div>

              {/* Standard Flat Rate (₹) */}
              <div className="bg-cream-50/50 p-4 rounded-2xl border border-brand-200/60">
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Standard Flat Rate (Fallback) (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={content.delivery?.flatRate ?? 80}
                    onChange={(e) => updateDelivery('flatRate', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input-field text-sm font-semibold pl-8"
                  />
                </div>
                <p className="text-[11px] text-brand-500 mt-1.5 leading-snug">
                  Used if Flat Rate model is chosen or if GPS coordinates are unavailable.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live Distance Simulator Sandbox */}
          <div className="p-6 rounded-3xl bg-brand-950 text-cream-50 space-y-5 border border-brand-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-cream-50">
                    Live Distance Pricing Sandbox
                  </h3>
                  <p className="text-xs text-cream-300">
                    Test how your delivery rates will behave for any distance and order value before publishing.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-amber-300 border border-white/10">
                Real-Time Simulation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Simulator Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-cream-200 font-bold">Customer Distance from Store:</span>
                    <span className="font-mono text-amber-300 font-bold text-sm">{simDistance} KM</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="0.5"
                    value={simDistance}
                    onChange={(e) => setSimDistance(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-cream-400 mt-1">
                    <span>1 KM</span>
                    <span>15 KM</span>
                    <span>30 KM</span>
                    <span>45 KM</span>
                    <span>60 KM</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-cream-200 font-bold">Customer Order Subtotal:</span>
                    <span className="font-mono text-amber-300 font-bold text-sm">₹{simSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="4000"
                    step="100"
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-cream-400 mt-1">
                    <span>₹200</span>
                    <span>₹1,000</span>
                    <span>₹2,000</span>
                    <span>₹3,000</span>
                    <span>₹4,000</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Card */}
              {(() => {
                const simulatedResult = calculateDeliveryFee({
                  subtotal: simSubtotal,
                  customerLat: 15.2993, // Sample point
                  customerLng: 74.1240,
                  shopLat: 15.2993,
                  shopLng: 74.1240 + simDistance / 111, // Approximately simDistance km away
                  settings: content.delivery,
                });

                const cfg = { ...DEFAULT_DELIVERY_SETTINGS, ...(content.delivery || {}) };
                const isOverFreeThreshold = cfg.freeDeliveryThreshold > 0 && simSubtotal >= cfg.freeDeliveryThreshold;
                const extraKm = Math.max(0, Math.ceil(simDistance - cfg.baseKm));

                return (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-cream-300 font-bold">
                        Calculated Delivery Charge:
                      </span>
                      {isOverFreeThreshold ? (
                        <span className="text-xl font-serif font-bold text-emerald-400">
                          FREE DELIVERY 🎉
                        </span>
                      ) : (
                        <span className="text-2xl font-serif font-bold text-amber-300">
                          ₹{simulatedResult.fee}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-cream-200 space-y-1.5 pt-2 border-t border-white/10">
                      <div className="flex justify-between">
                        <span className="text-cream-300">Pricing Model:</span>
                        <span className="font-semibold capitalize text-cream-100">{cfg.pricingModel} rate</span>
                      </div>
                      {cfg.pricingModel === 'km' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-cream-300">Base Zone (0 to {cfg.baseKm} km):</span>
                            <span className="font-semibold text-cream-100">₹{cfg.basePrice}</span>
                          </div>
                          {simDistance > cfg.baseKm && simDistance <= (cfg.maxKm || 50) && (
                            <div className="flex justify-between">
                              <span className="text-cream-300">Extra {extraKm} km × ₹{cfg.pricePerKm}/km:</span>
                              <span className="font-semibold text-cream-100">+₹{extraKm * cfg.pricePerKm}</span>
                            </div>
                          )}
                          {cfg.maxKm && simDistance > cfg.maxKm && (
                            <div className="flex justify-between text-amber-300">
                              <span>Exceeds max {cfg.maxKm}km local radius:</span>
                              <span className="font-semibold">Flat Courier ₹{cfg.flatOutsideRate}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between pt-1 border-t border-white/10 font-bold text-cream-100">
                        <span>Total Customer Bill:</span>
                        <span>₹{(simSubtotal + simulatedResult.fee).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-cream-400 italic">
                      "{simulatedResult.explanation}"
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer Save Row */}
          <div className="flex justify-end pt-4 border-t border-brand-100">
            {renderSaveButton('Save Delivery & KM Pricing')}
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

      {/* LOCATION BANNER POP-UP MODAL */}
      {bannerModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
          onClick={() => setBannerModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-brand-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-brand-200/80 flex items-center justify-between bg-gradient-to-r from-cream-50 to-white">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-forest-100 text-forest-800">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-950">
                    {editingBannerIndex === null ? 'Add Sourcing Region Banner' : `Edit Sourcing Banner: ${bannerForm.locationKey || 'Regional Card'}`}
                  </h3>
                  <p className="text-xs text-brand-600">
                    Configure the photo, region title, origin badge, and preview it before publishing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBannerModalOpen(false)}
                className="p-2 rounded-xl text-brand-400 hover:text-brand-900 hover:bg-cream-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split view (Left Form, Right Live Preview) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Input Fields */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Sourcing Region Key */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Sourcing Region / Origin Name <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bannerForm.locationKey}
                          onChange={(e) => setBannerForm((b) => ({ ...b, locationKey: e.target.value }))}
                          placeholder="e.g. Goa, Karnataka, Konkan, etc."
                          className="input-field text-xs font-semibold flex-1"
                        />
                        {dbLocations.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                setBannerForm((b) => ({ ...b, locationKey: e.target.value }));
                              }
                            }}
                            value=""
                            className="text-xs rounded-xl border border-brand-200 bg-cream-50 px-3 py-2 text-brand-800 font-medium shrink-0 cursor-pointer"
                            title="Quick pick from existing product origins"
                          >
                            <option value="">Select from DB...</option>
                            {dbLocations.map((loc) => (
                              <option key={loc} value={loc}>
                                📍 {loc}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <p className="text-[10.5px] text-brand-500 mt-1">
                        Region name displayed on the card and filter tabs (e.g. Goa, Karnataka).
                      </p>
                    </div>

                    {/* Origin Display Tag */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Origin Display Tag (Upper Badge)
                      </label>
                      <input
                        type="text"
                        value={bannerForm.tag}
                        onChange={(e) => setBannerForm((b) => ({ ...b, tag: e.target.value }))}
                        placeholder="e.g. 100% Sourced in Goa & Karnataka"
                        className="input-field text-xs"
                      />
                    </div>

                    {/* Main Banner Title */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Main Banner Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm((b) => ({ ...b, title: e.target.value }))}
                        placeholder="e.g. Margao & Panaji Coastal Groves"
                        className="input-field text-xs font-semibold"
                      />
                    </div>

                    {/* Subtitle */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Subtitle / Regional Harvest Story
                      </label>
                      <textarea
                        rows={2}
                        value={bannerForm.subtitle}
                        onChange={(e) => setBannerForm((b) => ({ ...b, subtitle: e.target.value }))}
                        placeholder="e.g. Artisanal sun-drying along the Konkan coastline with rich buttery undertones."
                        className="input-field text-xs resize-none"
                      />
                    </div>

                    {/* Button Text */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Call-to-Action Button Label
                      </label>
                      <input
                        type="text"
                        value={bannerForm.linkText}
                        onChange={(e) => setBannerForm((b) => ({ ...b, linkText: e.target.value }))}
                        placeholder="e.g. Explore Goa Cashews"
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Banner Photo Widget */}
                  <div className="pt-2">
                    <ImageUploadWidget
                      label="Banner Background Photo (Recommended: 1200 × 500 px Landscape)"
                      value={bannerForm.image}
                      onChange={(url) => setBannerForm((b) => ({ ...b, image: url }))}
                      aspectRatio="wide"
                      helpText="Choose from presets or upload high-resolution orchard/harvest landscape photography."
                    />
                  </div>
                </div>

                {/* Right: Live Interactive Card Preview */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
                    <Eye className="w-4 h-4 text-forest-700" />
                    <span>Live Customer View Preview</span>
                  </div>

                  <div className="rounded-2xl border-2 border-brand-200 overflow-hidden shadow-md bg-brand-950 text-white relative min-h-[260px] flex flex-col justify-end p-5">
                    {/* Background Image */}
                    {bannerForm.image ? (
                      <img
                        src={bannerForm.image}
                        alt={bannerForm.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-950 to-forest-950 flex items-center justify-center text-brand-400 text-xs">
                        No image selected
                      </div>
                    )}
                    {/* Dark gradient scrim for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

                    {/* Content overlay */}
                    <div className="relative z-10 space-y-2">
                      {bannerForm.tag && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/90 text-brand-950 text-[10px] font-bold tracking-wide uppercase">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{bannerForm.tag}</span>
                        </span>
                      )}
                      <h4 className="font-serif text-lg font-bold text-white drop-shadow-sm leading-snug">
                        {bannerForm.title || 'Regional Harvest Title'}
                      </h4>
                      {bannerForm.subtitle && (
                        <p className="text-xs text-cream-100/90 line-clamp-2">
                          {bannerForm.subtitle}
                        </p>
                      )}
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-cream-50 text-brand-950 text-xs font-bold shadow-sm">
                          <span>{bannerForm.linkText || 'Explore Harvest'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                    <p className="font-bold mb-0.5">Preview Note:</p>
                    <p>This shows exactly how the banner renders on the storefront in the &ldquo;Coastal Harvest & Sourcing Regions&rdquo; slider.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-200 bg-cream-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setBannerModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-brand-200 bg-white hover:bg-cream-100 text-brand-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveBannerModal(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-forest-600 bg-white hover:bg-forest-50 text-forest-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save to Drafts
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBannerModal(true)}
                  disabled={saving}
                  className="flex-1 sm:flex-initial btn-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Publish Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER ADD / EDIT MODAL */}
      {heroModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-brand-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-brand-200 bg-cream-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-800 text-cream-50 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-950">
                    {editingHeroIndex === null ? 'Add New Hero Banner' : `Edit Hero Banner #${editingHeroIndex + 1}`}
                  </h3>
                  <p className="text-xs text-brand-600">
                    Customize headline typography, badges, imagery, and button actions for the storefront slider.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHeroModalOpen(false)}
                className="p-2 rounded-xl text-brand-400 hover:text-brand-900 hover:bg-brand-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Input Fields */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Floating Pill Badge */}
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Floating Pill Badge Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={heroForm.badge}
                      onChange={(e) => setHeroForm((h) => ({ ...h, badge: e.target.value }))}
                      placeholder="e.g. India's Premium Cashew Brand"
                      className="input-field text-xs"
                    />
                  </div>

                  {/* Headline Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Headline Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={heroForm.titleLine1}
                        onChange={(e) => setHeroForm((h) => ({ ...h, titleLine1: e.target.value }))}
                        placeholder="Cashews,"
                        className="input-field text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Headline Line 2
                      </label>
                      <input
                        type="text"
                        value={heroForm.titleLine2}
                        onChange={(e) => setHeroForm((h) => ({ ...h, titleLine2: e.target.value }))}
                        placeholder="crafted to"
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-brand-900 block mb-1">
                        Highlight (Italic)
                      </label>
                      <input
                        type="text"
                        value={heroForm.titleHighlight}
                        onChange={(e) => setHeroForm((h) => ({ ...h, titleHighlight: e.target.value }))}
                        placeholder="perfection."
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Subtitle Description */}
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Sub-heading Description
                    </label>
                    <textarea
                      rows={3}
                      value={heroForm.subtitle}
                      onChange={(e) => setHeroForm((h) => ({ ...h, subtitle: e.target.value }))}
                      placeholder="From the sun-drenched coast of Goa to your home — hand-sorted, freshly packed..."
                      className="input-field text-xs resize-none"
                    />
                  </div>

                  {/* Button Label */}
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Call-to-Action Button Label
                    </label>
                    <input
                      type="text"
                      value={heroForm.buttonText}
                      onChange={(e) => setHeroForm((h) => ({ ...h, buttonText: e.target.value }))}
                      placeholder="Shop Now"
                      className="input-field text-xs"
                    />
                  </div>

                  {/* Banner Photography Upload */}
                  <div className="pt-2">
                    <ImageUploadWidget
                      label="Banner Background Photography (Landscape Recommended)"
                      value={heroForm.image}
                      onChange={(url) => setHeroForm((h) => ({ ...h, image: url }))}
                      aspectRatio="landscape"
                      helpText="Upload high-res product or harvest photography directly to Cloudinary."
                    />
                  </div>
                </div>

                {/* Right: Live Interactive Card Preview */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
                    <Eye className="w-4 h-4 text-brand-700" />
                    <span>Real-Time Customer Preview</span>
                  </div>

                  <div className="rounded-2xl border-2 border-brand-200 overflow-hidden shadow-md bg-cream-100 relative min-h-[300px] flex items-center p-5">
                    {/* Background Image */}
                    {heroForm.image ? (
                      <img
                        src={heroForm.image}
                        alt={heroForm.titleLine1}
                        className="absolute inset-0 w-full h-full object-cover object-right"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-cream-200 flex items-center justify-center text-brand-400 text-xs">
                        No image uploaded
                      </div>
                    )}
                    {/* Directional Vignette Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cream-100/95 via-cream-100/80 to-transparent pointer-events-none" />

                    {/* Content overlay */}
                    <div className="relative z-10 max-w-[220px] space-y-2">
                      {heroForm.badge && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 border border-brand-200 text-brand-900 text-[10px] font-bold">
                          <Leaf className="w-2.5 h-2.5 text-forest-700" />
                          <span>{heroForm.badge}</span>
                        </span>
                      )}
                      <h4 className="font-serif text-lg font-bold text-brand-950 leading-tight">
                        {heroForm.titleLine1 || 'Headline 1'} <br />
                        {heroForm.titleLine2 || 'Headline 2'} <br />
                        <span className="italic font-normal text-brand-800">{heroForm.titleHighlight || 'Highlight'}</span>
                      </h4>
                      {heroForm.subtitle && (
                        <p className="text-[11px] text-brand-800/90 line-clamp-3">
                          {heroForm.subtitle}
                        </p>
                      )}
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-700 text-cream-50 text-xs font-semibold shadow-sm">
                          <span>{heroForm.buttonText || 'Shop Now'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                    <p className="font-bold mb-0.5">Slider Behavior Note:</p>
                    <p>When you have 2 or more banners saved, horizontal dots and swipe transitions automatically appear on the storefront. If only 1 banner exists, dots are hidden for a clean look.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-200 bg-cream-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setHeroModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-brand-200 bg-white hover:bg-cream-100 text-brand-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveHeroModal(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-brand-300 bg-white hover:bg-cream-100 text-brand-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save to Drafts
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveHeroModal(true)}
                  disabled={saving}
                  className="flex-1 sm:flex-initial btn-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Publish Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map Location & Spot Picker Modal */}
      {mapPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-brand-200 relative animate-scale-in max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-forest-100 text-forest-800">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-950">
                    Spot & Pin Store on Map
                  </h3>
                  <p className="text-xs text-brand-500">
                    Search your shop address or use device GPS to accurately pin the store.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapPickerOpen(false)}
                className="p-2 rounded-full text-brand-400 hover:text-brand-900 hover:bg-cream-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box & GPS Button */}
            <div className="space-y-3">
              <form onSubmit={handleSearchSpot} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-brand-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spotSearchQuery}
                    onChange={(e) => setSpotSearchQuery(e.target.value)}
                    placeholder="Search e.g. Krisha Dry Fruits APMC Yard Bangalore..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-cream-50 border border-brand-200 rounded-xl text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingSpot || !spotSearchQuery.trim()}
                  className="btn-primary py-2 px-4 text-xs font-semibold shrink-0 disabled:opacity-50"
                >
                  {searchingSpot ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search Spot'}
                </button>
                <button
                  type="button"
                  onClick={handlePickDeviceGps}
                  className="px-3 py-2 bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  title="Use current GPS from this device"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Use Device GPS</span>
                </button>
              </form>

              {/* Candidate Results */}
              {spotCandidates.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-cream-50 border border-brand-200 text-xs">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block px-1">
                    Select Matching Location:
                  </span>
                  {spotCandidates.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setPickedSpot({
                          lat: Number(c.lat).toFixed(6),
                          lng: Number(c.lon).toFixed(6),
                          address: c.display_name,
                        })
                      }
                      className="w-full text-left p-2 rounded-lg hover:bg-brand-100 text-brand-900 truncate flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                      <span className="truncate">{c.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Preview & Map Pin */}
            {pickedSpot && (
              <div className="space-y-3">
                <div className="w-full h-64 rounded-2xl overflow-hidden border-2 border-forest-400 shadow-inner bg-cream-100 relative">
                  <iframe
                    title="Live Spot Map Pin"
                    src={`https://maps.google.com/maps?q=${pickedSpot.lat},${pickedSpot.lng}&z=16&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                  />
                  <div className="absolute top-2 left-2 bg-brand-950/80 text-cream-100 text-[11px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-md">
                    📍 Lat: {pickedSpot.lat}, Lng: {pickedSpot.lng}
                  </div>
                </div>

                {pickedSpot.address && (
                  <p className="text-xs text-brand-700 bg-cream-50 p-2.5 rounded-xl border border-brand-200">
                    <span className="font-bold">Detected Address:</span> {pickedSpot.address}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-100">
              <button
                type="button"
                onClick={() => setMapPickerOpen(false)}
                className="btn-outline py-2 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSpot}
                disabled={!pickedSpot}
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply Location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Showcase Card Add/Edit Modal */}
      {showcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-brand-200 relative animate-scale-in max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-100 text-brand-800">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-950">
                    {editingShowcaseIndex !== null ? 'Edit Showcase Card' : 'Add New Showcase Card'}
                  </h3>
                  <p className="text-xs text-brand-500">
                    Configure the title, subtitle, image, and category mapping.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowcaseModalOpen(false)}
                className="p-2 rounded-full text-brand-400 hover:text-brand-900 hover:bg-cream-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Card Title / Heading <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={showcaseForm.title}
                  onChange={(e) => setShowcaseForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Royal California Almonds, Jumbo Cashews"
                  className="input-field text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 block mb-1">
                  Card Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={showcaseForm.subtitle || ''}
                  onChange={(e) => setShowcaseForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Nonpareil Jumbo • Freshly Roasted & Salted"
                  className="input-field text-xs sm:text-sm"
                />
              </div>

              <div>
                <ImageUploadWidget
                  label="Showcase Card Photo"
                  value={showcaseForm.image}
                  onChange={(url) => setShowcaseForm((prev) => ({ ...prev, image: url }))}
                  folder="krisha_dry_fruits/showcase"
                />
              </div>

              {/* Live Preview Inside Modal */}
              <div className="pt-2">
                <label className="text-xs font-bold text-brand-900 block mb-1.5">
                  Live Card Preview (How it appears to customers):
                </label>
                <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-brand-200 bg-white shadow-md">
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-cream-200">
                    {showcaseForm.image ? (
                      <img
                        src={showcaseForm.image}
                        alt={showcaseForm.title || 'Preview'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-brand-400">
                        Upload or paste image above
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white border-t border-brand-100 flex flex-col justify-between">
                    <div>
                      <p className="font-serif text-sm font-bold text-brand-950 leading-tight truncate">
                        {showcaseForm.title || 'Card Title'}
                      </p>
                      <p className="text-[11px] text-brand-600 truncate mt-0.5">
                        {showcaseForm.subtitle || 'Card Subtitle'}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-semibold text-brand-800 flex items-center gap-1">
                      <span>Shop Collection</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-100">
              <button
                type="button"
                onClick={() => setShowcaseModalOpen(false)}
                className="btn-outline py-2 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveShowcaseModal}
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingShowcaseIndex !== null ? 'Save Changes' : 'Create Showcase Card'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Dock: Easily Save Anywhere without scrolling */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-brand-950/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl border border-brand-700/60 shadow-2xl animate-fade-in">
        <span className="text-xs font-medium text-cream-200 hidden sm:inline">Storefront Changes:</span>
        {renderSaveButton('Save All Changes', 'btn-primary py-2 px-4 text-xs font-bold rounded-xl shadow-md')}
      </div>

      {/* Floating In-App Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-slide-up border ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'info'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-brand-400 hover:text-brand-900 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
