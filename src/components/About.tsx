import { Leaf, Award, Heart, Users, Sparkles, MapPin, Check } from 'lucide-react';

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-cream-200 to-brand-50 py-16 sm:py-20 border-b border-brand-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 mb-6 border border-brand-200">
            <Leaf className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-bold text-brand-800 tracking-wide uppercase">Our Heritage & Sourcing</span>
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-brand-950 mb-6">
            From mountain valleys & coastal groves to <span className="text-brand-700">your home</span>
          </h1>
          <p className="text-base sm:text-lg text-brand-700 leading-relaxed max-w-2xl mx-auto">
            Krisha Dry Fruits was born from a simple conviction: that authentic, chemical-free dry fruits deserve to be experienced in their purest form. What started with coastal harvests in Goa has expanded into a premier dry fruits house in Bengaluru, partnering directly with mountain growers in Kashmir, California, and desert palm oases.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl overflow-hidden shadow-luxury border border-brand-200">
            <img
              src="https://images.pexels.com/photos/11135641/pexels-photo-11135641.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200"
              alt="Dry fruits market display"
              className="w-full h-[420px] object-cover"
            />
          </div>
          <div className="space-y-4">
            <div className="text-xs font-bold text-brand-500 uppercase tracking-wider">Generations of Craftsmanship</div>
            <h2 className="font-serif text-3xl font-bold text-brand-950">
              Preserving nature's original oils & flavors
            </h2>
            <p className="text-brand-700 leading-relaxed text-sm sm:text-base">
              Unlike industrial dry fruit processors who strip natural oils, polish nuts with synthetic coatings, or bleach shells, Krisha Dry Fruits adheres to traditional sorting and packaging integrity.
            </p>
            <p className="text-brand-700 leading-relaxed text-sm sm:text-base">
              Our <strong>Kashmiri Mamra Badam</strong> retains 100% of its high-potency oil. Our <strong>Snow White Walnut Halves</strong> are cracked from fresh Pahadi harvest without bitter tannin oxidation. And our <strong>W180 King Cashews</strong> are hand-selected whole kernels sun-dried under Goan coastal breezes.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <div className="p-3 rounded-2xl bg-forest-50 border border-forest-200 flex items-center gap-2 text-xs font-bold text-forest-800">
                <Check className="w-4 h-4 text-forest-600" />
                <span>Zero Chemical Polish or Wax</span>
              </div>
              <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 flex items-center gap-2 text-xs font-bold text-brand-800">
                <Check className="w-4 h-4 text-brand-600" />
                <span>Nitrogen Sealed Freshness</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream-200/50 py-16 border-t border-brand-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-brand-950 mb-3">Our Core Pillars</h2>
            <p className="text-brand-600 text-sm">The uncompromising standards behind every pouch we pack.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Leaf, title: 'Direct Farm Sourcing', desc: 'No middlemen. We work directly with orchard growers in Kashmir, Goa, and California.' },
              { icon: Award, title: 'Caliber Guaranteed', desc: 'Every grade is physically inspected and size-certified before airtight vacuum sealing.' },
              { icon: Heart, title: 'Zero Artificial Polish', desc: '100% raw and natural. No sulfur fumigation, chemical glaze, or artificial coloring.' },
              { icon: Users, title: 'Doorstep Precision', desc: 'Pinpoint GPS delivery mapping ensures your order reaches your exact home address.' },
            ].map((v) => (
              <div key={v.title} className="card p-6 text-center hover:shadow-luxury-lg transition-all border border-brand-200/60 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4 text-brand-700">
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-brand-950 mb-2">{v.title}</h3>
                <p className="text-xs text-brand-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
