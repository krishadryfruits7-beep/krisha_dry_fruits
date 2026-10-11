import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter, MessageCircle, ExternalLink } from 'lucide-react';
import { useSiteContent, getStoreGoogleMapsUrl } from '@/site-content';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const content = useSiteContent();
  const { contact, social, footerBio } = content;
  const mapsUrl = getStoreGoogleMapsUrl(contact);

  return (
    <footer className="bg-brand-950 text-cream-200 border-t border-brand-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white ring-2 ring-brand-400/80 shadow-md flex items-center justify-center p-0.5 shrink-0">
                <img
                  src="/Krisha_Dry_Fruits_logo.png"
                  alt="Krisha Dry Fruits"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-cream-100 tracking-tight leading-none">
                  Krisha Dry Fruits
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cream-400 mt-1">
                  Artisanal Harvests
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-cream-300/80 leading-relaxed font-normal">
              {footerBio}
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-1">
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-brand-900 hover:bg-brand-800 text-cream-300 hover:text-cream-50 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-brand-900 hover:bg-brand-800 text-cream-300 hover:text-cream-50 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-brand-900 hover:bg-brand-800 text-cream-300 hover:text-cream-50 flex items-center justify-center transition-colors"
                  aria-label="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {social.whatsapp && (
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-brand-900 hover:bg-brand-800 text-cream-300 hover:text-cream-50 flex items-center justify-center transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-cream-50 uppercase tracking-wider mb-4">
              Catalogue
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button onClick={() => onNavigate('products')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  All Cashew Grades
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('grades')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  Understanding Cashew Sizes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  Jumbo King W180
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  Roasted & Salted Cashews
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  Honey Glazed Gourmet Cashews
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Orders */}
          <div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-cream-50 uppercase tracking-wider mb-4">
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button onClick={() => onNavigate('myorders')} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1.5">
                  <span>📦 Track My Orders</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  Our Coastal Story
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="text-cream-300/80 hover:text-cream-50 transition-colors">
                  Customer Care & Support
                </button>
              </li>
              <li>
                <span className="text-cream-400/80">Hours: {contact.hours}</span>
              </li>
            </ul>
          </div>

          {/* Contact Details & 1-Click Store Location */}
          <div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-cream-50 uppercase tracking-wider mb-4">
              Direct Contact & Store
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-cream-300/80">
              <li className="flex items-start gap-2.5 group">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <div className="font-semibold text-cream-100">{contact.shopName || 'Flagship Store'}</div>
                  <p className="text-cream-300/85 mt-0.5 leading-relaxed">{contact.address}</p>
                  {contact.landmark && (
                    <p className="text-[11px] text-cream-400/80 mt-0.5">
                      Near: {contact.landmark}
                    </p>
                  )}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] text-amber-300 hover:text-amber-200 font-bold mt-1.5 transition-colors underline underline-offset-4"
                  >
                    <span>Open in Google Maps & Get Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                <div className="flex flex-col">
                  <a href={`tel:${contact.phone}`} className="hover:text-cream-50 transition-colors font-medium">
                    {contact.phone}
                  </a>
                  {contact.extraPhone && (
                    <a href={`tel:${contact.extraPhone}`} className="hover:text-cream-50 transition-colors text-[11px] text-cream-400">
                      Alt: {contact.extraPhone}
                    </a>
                  )}
                </div>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-brand-400" />
                <a href={`mailto:${contact.email}`} className="hover:text-cream-50 transition-colors">
                  {contact.email}
                </a>
              </li>
            </ul>

            <div className="mt-5 p-3 rounded-xl bg-brand-900/60 border border-brand-800 text-[11px] text-cream-300">
              <div className="font-semibold text-cream-100 flex items-center gap-1.5 mb-0.5">
                <Leaf className="w-3.5 h-3.5 text-forest-400" />
                <span>FSSAI Lic: {contact.fssaiNumber}</span>
              </div>
              <p>{contact.fssaiText}</p>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-12 pt-6 border-t border-brand-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream-400/80">
          <p>© {new Date().getFullYear()} Krisha Dry Fruits. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Goa & Karnataka Harvest</span>
            <span>•</span>
            <span>Pan-India Air Dispatch</span>
          </div>
        </div>
      </div>
    </footer>
  );
}