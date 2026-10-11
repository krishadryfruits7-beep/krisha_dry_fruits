import { useState } from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink, Store, Compass, Image as ImageIcon, Map as MapIcon } from 'lucide-react';
import { useSiteContent, getStoreGoogleMapsUrl, getStoreEmbedMapUrl } from '@/site-content';

interface StoreLocationSectionProps {
  onContactClick?: () => void;
}

export default function StoreLocationSection({ onContactClick }: StoreLocationSectionProps) {
  const content = useSiteContent();
  const { contact } = content;
  const mapsUrl = getStoreGoogleMapsUrl(contact);
  const embedUrl = getStoreEmbedMapUrl(contact);
  const [viewMode, setViewMode] = useState<'map' | 'photo'>('map');

  return (
    <section id="store-location" className="py-12 sm:py-16 bg-gradient-to-b from-cream-50/80 via-white to-cream-100/60 border-t border-brand-200/50 overflow-hidden relative">
      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-forest-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Store className="w-3.5 h-3.5 text-forest-600" />
            <span>Visit Our Physical Store</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-950 tracking-tight">
            Taste & Experience Freshness in Person
          </h2>
          <p className="text-xs sm:text-sm text-brand-700/90 mt-2 leading-relaxed">
            Stop by our flagship store & tasting outlet. Sample all artisanal cashew grades straight from coastal harvests before you choose.
          </p>
        </div>

        {/* Main Store Highlight Card */}
        <div className="rounded-3xl bg-white border border-brand-200/80 shadow-luxury overflow-hidden grid lg:grid-cols-12 gap-0">
          
          {/* Left / Info Side */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-bold text-forest-700">
                  Open For Walk-In Customers
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
                {contact.shopName || 'Krisha Dry Fruits Flagship Store & Outlet'}
              </h3>

              <div className="mt-5 space-y-4 text-xs sm:text-sm">
                {/* Physical Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-center shrink-0 text-brand-700 shadow-xs">
                    <MapPin className="w-4 h-4 text-brand-700" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-900 text-xs">Store Address</div>
                    <p className="text-brand-700 mt-0.5 leading-relaxed font-medium">
                      {contact.address}
                    </p>
                    {contact.landmark && (
                      <p className="text-[11px] text-brand-500 font-medium mt-0.5">
                        Landmark: <span className="text-brand-800">{contact.landmark}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-cream-100 border border-brand-200/80 flex items-center justify-center shrink-0 text-brand-700 shadow-xs">
                    <Clock className="w-4 h-4 text-brand-700" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-900 text-xs">Store Hours</div>
                    <p className="text-brand-700 mt-0.5 font-medium">
                      {contact.hours}
                    </p>
                  </div>
                </div>

                {/* Phone & Contact */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-forest-50 border border-forest-200/80 flex items-center justify-center shrink-0 text-forest-700 shadow-xs">
                    <Phone className="w-4 h-4 text-forest-700" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-900 text-xs">Helpline / Direct Enquiries</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-forest-700 hover:text-forest-900 font-semibold transition-colors inline-block"
                      >
                        {contact.phone}
                      </a>
                      {contact.extraPhone && (
                        <span className="text-xs text-brand-400 font-medium">
                          • Alt: <a href={`tel:${contact.extraPhone}`} className="text-forest-700 hover:text-forest-900 font-semibold">{contact.extraPhone}</a>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: 1-Click Directions on Google Maps */}
            <div className="pt-4 border-t border-brand-100 flex flex-wrap items-center gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-900/15 group"
              >
                <Navigation className="w-4 h-4 text-amber-300 transition-transform group-hover:scale-110" />
                <span>Open in Google Maps & Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
              </a>

              <a
                href={`tel:${contact.phone}`}
                className="btn-secondary py-3 px-5 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-brand-700" />
                <span>Call Store</span>
              </a>

              {contact.extraPhone && (
                <a
                  href={`tel:${contact.extraPhone}`}
                  className="btn-secondary py-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 text-forest-800 border-forest-300/80 bg-forest-50/60 hover:bg-forest-100"
                >
                  <Phone className="w-3.5 h-3.5 text-forest-700" />
                  <span>Call Alt</span>
                </a>
              )}
            </div>
          </div>

          {/* Right / Interactive Live Map & Visual Side */}
          <div className="lg:col-span-5 relative bg-cream-100 min-h-[300px] sm:min-h-[360px] flex flex-col justify-between overflow-hidden border-t lg:border-t-0 lg:border-l border-brand-200/80">
            {viewMode === 'map' ? (
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] flex flex-col justify-between">
                <iframe
                  title="Krisha Dry Fruits Live Store Location"
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  className="w-full flex-1 min-h-[260px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Floating Top Control Bar */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950/85 backdrop-blur-md border border-brand-800 text-cream-100 text-[11px] font-semibold shadow-md pointer-events-auto">
                    <Compass className="w-3.5 h-3.5 text-amber-300" />
                    <span>Live Map Pin</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMode('photo')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-brand-950 text-[11px] font-bold border border-brand-200 shadow-md transition-all pointer-events-auto cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                    <span>View Photo</span>
                  </button>
                </div>

                {/* Bottom Bar */}
                <div className="p-3 bg-brand-950/95 backdrop-blur-md flex items-center justify-between border-t border-brand-800">
                  <span className="text-[11px] text-cream-200 font-medium truncate max-w-[200px]">
                    {contact.shopName || 'Krisha Dry Fruits'}
                  </span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Navigation className="w-3 h-3 text-amber-300" />
                    <span>Open in Maps</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] flex flex-col justify-between p-6 sm:p-8 overflow-hidden group">
                <img
                  src="/hero_cashew_bowl.jpg"
                  alt="Krisha Dry Fruits Storefront"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4] transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-brand-950/30" />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-cream-100 text-[11px] font-semibold">
                    <Compass className="w-3.5 h-3.5 text-amber-300" />
                    <span>Orchard Tasting Outlet</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700/90 backdrop-blur-md hover:bg-forest-600 text-cream-50 text-[11px] font-bold border border-forest-500 shadow-md transition-all cursor-pointer"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>Switch to Interactive Map</span>
                  </button>
                </div>

                <div className="relative z-10 my-auto py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-700 to-amber-600 mx-auto flex items-center justify-center text-white shadow-2xl border-4 border-white/30 animate-bounce duration-1000 mb-2">
                    <MapPin className="w-7 h-7 fill-current text-cream-50" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-cream-50 drop-shadow-md">
                    Direct Orchard Outlet
                  </h4>
                  <p className="text-xs text-cream-200/90 mt-1 max-w-xs mx-auto drop-shadow-sm">
                    Authentic sun-dried cashew harvest straight from coastal orchards.
                  </p>
                </div>

                <div className="relative z-10 pt-3 border-t border-white/15">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white text-cream-50 hover:text-brand-950 backdrop-blur-md text-xs font-bold transition-all shadow-md"
                  >
                    <span>Navigate to Store in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}