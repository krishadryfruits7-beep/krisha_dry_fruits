import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check, Navigation, ExternalLink, Clock, Store } from 'lucide-react';
import { useSiteContent, getStoreGoogleMapsUrl } from '@/site-content';

export default function Contact() {
  const { contact } = useSiteContent();
  const mapsUrl = getStoreGoogleMapsUrl(contact);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
          <Store className="w-3.5 h-3.5 text-brand-600" />
          <span>Support & Flagship Storefront</span>
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-brand-950 mb-2">Get in Touch</h1>
        <p className="text-sm text-brand-600 max-w-lg mx-auto leading-relaxed">
          Questions about our cashew varieties, bulk festive gifting, or visit directions? We are here to assist.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact info cards */}
        <div className="space-y-4">
          {/* Store Location Card with Google Maps link */}
          <div className="card p-5 border-2 border-brand-200/90 shadow-luxury bg-gradient-to-br from-white via-cream-50/50 to-cream-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-full">
                Physical Store
              </span>
            </div>
            
            <h3 className="font-serif text-base font-bold text-brand-950 mb-1">
              {contact.shopName || 'Visit Our Store'}
            </h3>
            <p className="text-xs text-brand-700 leading-relaxed font-medium">
              {contact.address}
            </p>
            {contact.landmark && (
              <p className="text-[11px] text-brand-500 mt-1 font-medium">
                Landmark: <span className="text-brand-800">{contact.landmark}</span>
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-brand-200/60">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-xs font-bold shadow-md transition-all active:scale-95 group"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:scale-110" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Phone Card */}
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3 text-brand-700">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-brand-900 mb-1">Customer Helpline</h3>
            <div className="space-y-1">
              <a
                href={`tel:${contact.phone}`}
                className="text-sm font-semibold text-brand-900 hover:text-brand-600 transition-colors block"
              >
                {contact.phone}
              </a>
              {contact.extraPhone && (
                <a
                  href={`tel:${contact.extraPhone}`}
                  className="text-xs font-semibold text-forest-700 hover:text-forest-900 transition-colors block"
                >
                  Alt: {contact.extraPhone}
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-500 mt-2">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>{contact.hours}</span>
            </div>
          </div>

          {/* Email Card */}
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3 text-brand-700">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-brand-900 mb-1">Email Enquiries</h3>
            <a
              href={`mailto:${contact.email}`}
              className="text-sm font-semibold text-brand-900 hover:text-brand-600 transition-colors block"
            >
              {contact.email}
            </a>
            <p className="text-xs text-brand-500 mt-1">We respond within 24 hours.</p>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8 bg-white shadow-luxury border border-brand-200/80">
            <h2 className="font-serif text-xl font-semibold text-brand-900 mb-2">Send us a message</h2>
            <p className="text-xs text-brand-600 mb-6">
              Have a custom requirement, feedback, or need bulk festive cashew hampers? Send your request below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-brand-700 mb-1.5 block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-700 mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-brand-700 mb-1.5 block">Message / Enquiry</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-field resize-none"
                  rows={5}
                  placeholder="How can we assist you with our cashews or delivery?"
                />
              </div>
              <button
                type="submit"
                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-7 py-3 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-md ${
                  sent ? 'bg-forest-600 text-cream-50' : 'bg-brand-600 text-cream-50 hover:bg-brand-700 hover:shadow-lg'
                }`}
              >
                {sent ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Message Sent Successfully!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}