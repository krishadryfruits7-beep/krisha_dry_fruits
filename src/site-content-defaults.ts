export interface FeatureItem {
  id: string;
  iconName: 'Leaf' | 'Award' | 'Truck' | 'ShieldCheck' | 'Heart' | 'Clock' | 'Check';
  title: string;
  subtitle: string;
}

export interface LocationBanner {
  id: string;
  tag: string;
  locationKey: string;
  title: string;
  subtitle: string;
  image: string;
  linkText: string;
}

export interface HeroContent {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  titleHighlight: string;
  subtitle: string;
  buttonText: string;
  image: string;
}

export interface ContactInfo {
  phone: string;
  extraPhone?: string;
  email: string;
  shopName: string;
  address: string;
  landmark?: string;
  googleMapsUrl: string;
  latitude?: string;
  longitude?: string;
  hours: string;
  fssaiNumber?: string;
  fssaiText?: string;
  showFssai?: boolean;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
}

export interface SiteContent {
  announcement: string;
  hero: HeroContent;
  features: FeatureItem[];
  locationBanners: LocationBanner[];
  contact: ContactInfo;
  social: SocialLinks;
  footerBio: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcement: 'Free pan-India shipping over ₹1,200 • Freshly hand-sorted & packed within 48h',
  hero: {
    badge: "India's Premium Cashew Brand",
    titleLine1: 'Cashews,',
    titleLine2: 'crafted to',
    titleHighlight: 'perfection.',
    subtitle: 'From the sun-drenched coast of Goa to your home — hand-sorted, freshly packed, and available in hand-curated premium grades.',
    buttonText: 'Shop Now',
    image: '/hero_cashew_bowl.jpg',
  },
  features: [
    { id: '1', iconName: 'Leaf', title: '100%', subtitle: 'Natural' },
    { id: '2', iconName: 'Award', title: 'Premium', subtitle: 'Quality' },
    { id: '3', iconName: 'Truck', title: 'Pan-India', subtitle: 'Delivery' },
    { id: '4', iconName: 'ShieldCheck', title: 'Trusted by', subtitle: 'Thousands' },
  ],
  locationBanners: [],
  contact: {
    phone: '+91 98765 43210',
    extraPhone: '+91 91234 56789',
    email: 'care@krishadryfruits.in',
    shopName: 'Krisha Dry Fruits Flagship Store & Outlet',
    address: '123 Plantation Road, Near Old Market, Margao, Goa 403601, India',
    landmark: 'Opposite Old Market Bus Terminal, Margao',
    googleMapsUrl: 'https://maps.google.com/?q=15.2736,73.9582',
    latitude: '15.2736',
    longitude: '73.9582',
    hours: 'Mon - Sat: 9:00 AM - 7:00 PM',
    fssaiNumber: '',
    fssaiText: '',
    showFssai: false,
  },
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    whatsapp: 'https://wa.me/919876543210',
  },
  footerBio:
    'Connoisseur cashews directly sourced from certified multi-generation family farms along the Goa and Karnataka coastal belt. Freshly packed within 48 hours of artisanal processing.',
};
