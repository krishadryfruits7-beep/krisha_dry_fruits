import { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  Sparkles,
  Copy,
  Search,
  Filter,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/api';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { formatPrice } from '@/data';
import {
  getStoredProducts,
  saveStoredProducts,
  syncWithServerProducts,
  addStoredProduct,
  updateStoredProduct,
  deleteStoredProduct,
} from '@/products-storage';

const DEFAULT_PRESET_GRADES = ['W120', 'W180', 'W210', 'W240', 'W320', 'W334', 'S354', 'W450'];
const ALL_TYPES = ['Raw', 'Roasted', 'Roasted & Salted', 'Fried & Salted', 'Pepper Spiced', 'Honey Glazed'];
const DEFAULT_QUANTITIES = ['250g', '500g', '1kg', '2kg', '5kg'];

function makeType(type: string) {
  return {
    type,
    enabled: false,
    description: '',
    image: '',
    prices: DEFAULT_QUANTITIES.map((q) => ({ quantity: q, price: 0 })),
  };
}

function emptyProduct() {
  return {
    grade: '',
    name: '',
    tagline: '',
    description: '',
    longDescription: '',
    origin: 'Goa & Karnataka Coast, India',
    gradeDescription: '',
    image: '/cashew_single_nut.jpg',
    gallery: ['', '', '', ''] as string[],
    badge: 'Premium',
    active: true,
    priority: 0,
    types: ALL_TYPES.map((t, idx) => {
      const base = makeType(t);
      if (idx === 0) {
        base.enabled = true;
        base.prices = [
          { quantity: '250g', price: 290 },
          { quantity: '500g', price: 560 },
          { quantity: '1kg', price: 1080 },
          { quantity: '2kg', price: 2100 },
          { quantity: '5kg', price: 5000 },
        ];
      }
      return base;
    }),
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>(() => getStoredProducts());
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyProduct());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingField = useRef<string | null>(null);

  const [adminSearch, setAdminSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterOrigin, setFilterOrigin] = useState('ALL');
  const [customVariety, setCustomVariety] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.products.list()
      .then((data) => {
        if (Array.isArray(data)) {
          const synced = syncWithServerProducts(data as any);
          setProducts(synced);
        } else {
          setProducts(getStoredProducts());
        }
      })
      .catch(() => {
        setProducts(getStoredProducts());
      })
      .finally(() => setLoading(false));
  };

  const handleSyncWithAtlas = async () => {
    setLoading(true);
    try {
      const data = await adminApi.products.list();
      if (Array.isArray(data)) {
        const synced = syncWithServerProducts(data as any);
        setProducts(synced);
        showToast(`Successfully synced ${synced.length} products from database.`, 'success');
      }
    } catch (err: any) {
      showToast(`Database sync notice: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditProduct(null); setForm(emptyProduct()); setShowForm(true); };

  const openEdit = (p: any) => {
    setEditProduct(p);
    const existingTypes = p.types || [];
    const allTypeNames = Array.from(new Set([...ALL_TYPES, ...existingTypes.map((t: any) => t.type)]));
    const mergedTypes = allTypeNames.map((typeName) => {
      const existing = existingTypes.find((t: any) => t.type === typeName);
      return existing ? { ...existing, enabled: true } : makeType(typeName);
    });
    setForm({
      ...p,
      priority: typeof p.priority === 'number' ? p.priority : 0,
      gallery: [...(p.gallery || []), '', '', '', ''].slice(0, 4),
      types: mergedTypes,
    });
    setShowForm(true);
  };

  const duplicateProductForNewStock = (p: any) => {
    setEditProduct(null); // Create as brand new stock/product
    const existingTypes = p.types || [];
    const allTypeNames = Array.from(new Set([...ALL_TYPES, ...existingTypes.map((t: any) => t.type)]));
    const mergedTypes = allTypeNames.map((typeName) => {
      const existing = existingTypes.find((t: any) => t.type === typeName);
      return existing ? { ...existing, enabled: true } : makeType(typeName);
    });
    setForm({
      ...p,
      _id: undefined,
      id: undefined,
      name: `${p.name} (New Stock)`,
      priority: typeof p.priority === 'number' ? p.priority : 0,
      gallery: [...(p.gallery || []), '', '', '', ''].slice(0, 4),
      types: mergedTypes,
    });
    setShowForm(true);
  };

  const handleAddCustomVariety = () => {
    const name = customVariety.trim();
    if (!name) return;
    if (form.types.some((t: any) => t.type.toLowerCase() === name.toLowerCase())) {
      showToast('This variety is already listed.', 'info');
      return;
    }
    const newType = {
      type: name,
      enabled: true,
      description: `Delicious ${name} whole cashew kernels`,
      image: form.image || '/cashew_single_nut.jpg',
      prices: DEFAULT_QUANTITIES.map((q) => {
        const baseMap: Record<string, number> = { '250g': 320, '500g': 620, '1kg': 1200, '2kg': 2350, '5kg': 5600 };
        return { quantity: q, price: baseMap[q] || 350 };
      }),
    };
    setForm((f: any) => ({
      ...f,
      types: [...f.types, newType],
    }));
    setCustomVariety('');
    setExpandedType(name);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from the catalogue?')) return;
    deleteStoredProduct(id);
    try {
      await adminApi.products.delete(id);
    } catch (apiErr) {
      console.warn('Backend delete failed, removed from local storage:', apiErr);
    }
    load();
  };

  const handleToggleActive = async (p: any) => {
    const newActive = !p.active;
    updateStoredProduct(p._id || p.id, { active: newActive });
    try {
      await adminApi.products.update(p._id || p.id, { active: newActive });
    } catch (apiErr) {
      console.warn('Backend toggle active failed, updated in local storage:', apiErr);
    }
    load();
  };

  const handleMoveProductUp = async (p: any, index: number) => {
    if (index <= 0) return;
    const above = filteredAdminProducts[index - 1];
    if (!above) return;

    const abovePriority = typeof above.priority === 'number' ? above.priority : 0;
    const currentPriority = typeof p.priority === 'number' ? p.priority : 0;
    const newPriority = Math.max(abovePriority + 1, currentPriority + 1);

    const targetId = p._id || p.id;
    updateStoredProduct(targetId, { priority: newPriority });

    setProducts((prev) => {
      const copy = prev.map((item) => ((item._id === targetId || item.id === targetId) ? { ...item, priority: newPriority } : item));
      return syncWithServerProducts(copy);
    });

    try {
      await adminApi.products.update(targetId, { priority: newPriority });
    } catch (apiErr) {
      console.warn('Backend priority update failed:', apiErr);
    }
  };

  const handleMoveProductDown = async (p: any, index: number) => {
    if (index >= filteredAdminProducts.length - 1) return;
    const below = filteredAdminProducts[index + 1];
    if (!below) return;

    const belowPriority = typeof below.priority === 'number' ? below.priority : 0;
    const currentPriority = typeof p.priority === 'number' ? p.priority : 0;
    const newPriority = Math.min(belowPriority - 1, currentPriority - 1);

    const targetId = p._id || p.id;
    updateStoredProduct(targetId, { priority: newPriority });

    setProducts((prev) => {
      const copy = prev.map((item) => ((item._id === targetId || item.id === targetId) ? { ...item, priority: newPriority } : item));
      return syncWithServerProducts(copy);
    });

    try {
      await adminApi.products.update(targetId, { priority: newPriority });
    } catch (apiErr) {
      console.warn('Backend priority update failed:', apiErr);
    }
  };

  const handlePinProductToTop = async (p: any) => {
    const maxPriority = Math.max(0, ...products.map((item) => (typeof item.priority === 'number' ? item.priority : 0)));
    const newPriority = maxPriority + 10;
    const targetId = p._id || p.id;

    updateStoredProduct(targetId, { priority: newPriority });
    setProducts((prev) => {
      const copy = prev.map((item) => ((item._id === targetId || item.id === targetId) ? { ...item, priority: newPriority } : item));
      return syncWithServerProducts(copy);
    });

    try {
      await adminApi.products.update(targetId, { priority: newPriority });
    } catch (apiErr) {
      console.warn('Backend priority pin failed:', apiErr);
    }
  };

  const autoFillGradeDetails = (gradeCode: string) => {
    const g = (gradeCode || form.grade || '').trim().toUpperCase();
    if (!g) return;

    const matchNumber = g.match(/\d+/);
    const countNumber = matchNumber ? parseInt(matchNumber[0]) : null;
    const isSuperJumbo = countNumber !== null && countNumber <= 150;
    const isJumbo = countNumber !== null && countNumber <= 210;

    const suggestedName = `Jumbo King ${g}`;
    const suggestedTagline = isSuperJumbo
      ? `Ultra-rare super jumbo ${g} cashew harvest`
      : isJumbo
      ? `Large, premium grade ${g} hand-sorted whole cashews`
      : `Finest grade ${g} whole gourmet cashews`;

    const suggestedDesc = `Hand-sorted ${g} cashews celebrated for their uniform shape, exceptional crunch, and creamy sweetness.`;
    const suggestedLongDesc = `Our ${g} grade cashews are harvested at peak ripeness along certified coastal plantations and solar dried to retain their authentic buttery character. Each batch undergoes rigorous grading to ensure premium caliber and zero defect.`;
    const suggestedSpecs = countNumber
      ? `Approximately ${countNumber} whole nuts per pound · Premium export caliber`
      : `Grade ${g} whole kernels · High-density premium export standard`;
    const suggestedBadge = isSuperJumbo ? 'Rare King' : isJumbo ? 'Premium Choice' : 'Gourmet Selection';

    setForm((prev: any) => ({
      ...prev,
      grade: g,
      name: !prev.name || prev.name.startsWith('Jumbo King') ? suggestedName : prev.name,
      tagline: prev.tagline || suggestedTagline,
      description: prev.description || suggestedDesc,
      longDescription: prev.longDescription || suggestedLongDesc,
      gradeDescription: prev.gradeDescription || suggestedSpecs,
      badge: prev.badge || suggestedBadge,
      image: prev.image || '/cashew_single_nut.jpg',
    }));
  };

  const availablePresetGrades = Array.from(
    new Set([
      ...DEFAULT_PRESET_GRADES,
      ...products.map((p) => (p.grade || '').toUpperCase()).filter(Boolean),
    ])
  );

  const triggerUpload = (field: string) => {
    pendingField.current = field;
    if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = pendingField.current;
    if (!file || !field) return;
    setUploadingField(field);
    try {
      const url = await uploadToCloudinary(file);
      setForm((f: any) => {
        if (field === 'image') return { ...f, image: url };
        if (field.startsWith('gallery-')) {
          const idx = parseInt(field.split('-')[1]);
          const gallery = [...f.gallery];
          gallery[idx] = url;
          return { ...f, gallery };
        }
        if (field.startsWith('type-')) {
          const typeName = field.replace('type-', '');
          return { ...f, types: f.types.map((t: any) => t.type === typeName ? { ...t, image: url } : t) };
        }
        return f;
      });
    } catch (err: any) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const setField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const toggleType = (typeName: string) =>
    setForm((f: any) => ({
      ...f,
      types: f.types.map((t: any) => t.type === typeName ? { ...t, enabled: !t.enabled } : t),
    }));

  const updateTypeField = (typeName: string, key: string, val: any) =>
    setForm((f: any) => ({ ...f, types: f.types.map((t: any) => t.type === typeName ? { ...t, [key]: val } : t) }));

  const updatePriceByIdx = (typeName: string, idx: number, price: number) =>
    setForm((f: any) => ({
      ...f,
      types: f.types.map((t: any) =>
        t.type === typeName
          ? { ...t, prices: t.prices.map((p: any, i: number) => i === idx ? { ...p, price } : p) }
          : t
      ),
    }));

  const addQuantity = (typeName: string) =>
    setForm((f: any) => ({
      ...f,
      types: f.types.map((t: any) =>
        t.type === typeName
          ? { ...t, prices: [...t.prices, { quantity: '', price: 0 }] }
          : t
      ),
    }));

  const removeQuantity = (typeName: string, idx: number) =>
    setForm((f: any) => ({
      ...f,
      types: f.types.map((t: any) =>
        t.type === typeName
          ? { ...t, prices: t.prices.filter((_: any, i: number) => i !== idx) }
          : t
      ),
    }));

  const updateQuantityLabel = (typeName: string, idx: number, label: string) =>
    setForm((f: any) => ({
      ...f,
      types: f.types.map((t: any) =>
        t.type === typeName
          ? { ...t, prices: t.prices.map((p: any, i: number) => i === idx ? { ...p, quantity: label } : p) }
          : t
      ),
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const enabledTypes = form.types.filter((t: any) => t.enabled);
    if (enabledTypes.length === 0) {
      showToast('Please enable at least one variety (Raw, Roasted, etc.)', 'error');
      return;
    }
    if (!form.image) {
      showToast('Main product image is required', 'error');
      return;
    }
    if (!form.grade || !form.grade.trim()) {
      showToast('Please enter a cashew grade code (e.g. W120, W180, S354)', 'error');
      return;
    }

    setSaving(true);
    try {
      const cleanGrade = form.grade.trim().toUpperCase();
      const payload = {
        ...form,
        grade: cleanGrade,
        priority: typeof form.priority === 'number' ? form.priority : 0,
        gallery: form.gallery.filter(Boolean),
        types: enabledTypes.map(({ enabled: _, ...t }: any) => ({
          ...t,
          description: t.description || `Fresh premium ${t.type || 'cashew'} kernels`,
          image: t.image || form.image || '/cashew_single_nut.jpg',
        })),
      };

      if (editProduct) {
        const targetId = editProduct._id || editProduct.id;
        updateStoredProduct(targetId, payload);
        try {
          await adminApi.products.update(targetId, payload);
          showToast(`Product "${payload.name}" updated successfully!`, 'success');
        } catch (apiErr: any) {
          console.error('Backend update failed:', apiErr);
          showToast(`Notice: Saved to local catalog, MongoDB notice: ${apiErr.message}`, 'info');
        }
      } else {
        let savedPayload = { ...payload, createdAt: new Date().toISOString() };
        try {
          const res = await adminApi.products.create(savedPayload);
          if (res && (res._id || res.id)) {
            savedPayload = { ...savedPayload, _id: res._id, id: res._id, createdAt: res.createdAt || savedPayload.createdAt };
          }
          showToast(`Product "${savedPayload.name}" successfully created!`, 'success');
        } catch (apiErr: any) {
          console.error('Backend create failed:', apiErr);
          showToast(`Warning: Saved locally, backend sync notice: ${apiErr.message}`, 'info');
        }
        addStoredProduct(savedPayload);
      }

      setShowForm(false);
      load();
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Form view ──────────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="max-w-4xl space-y-6 animate-fade-in pb-12">
        <div className="flex items-center justify-between pb-4 border-b border-brand-200">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-950">
              {editProduct ? `Edit ${editProduct.name}` : 'Add New Cashew Grade'}
            </h1>
            <p className="text-xs text-brand-500 mt-0.5">
              Configure cashew grading attributes, images, varieties, and tiered weight pricing.
            </p>
          </div>
          <button
            onClick={() => setShowForm(false)}
            className="p-2 rounded-xl text-brand-500 hover:text-brand-950 hover:bg-cream-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Basic Information */}
          <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury space-y-4">
            <h2 className="font-serif text-base font-bold text-brand-950 border-b border-brand-100 pb-2">
              1. Grade & Marketing Essentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                    <span>Cashew Grade Code</span>
                    <span className="text-red-500">*</span>
                    <span className="text-[11px] font-normal text-brand-500">(Type any custom grade or pick a preset)</span>
                  </label>
                  {form.grade && (
                    <button
                      type="button"
                      onClick={() => autoFillGradeDetails(form.grade)}
                      className="text-[11px] font-bold text-brand-800 hover:text-brand-950 flex items-center gap-1 bg-cream-200/60 hover:bg-cream-200 px-2.5 py-1 rounded-lg transition-colors border border-brand-200"
                      title="Auto-fill recommended title, description, and specs for this grade"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                      Auto-fill Grade Template
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={form.grade}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setField('grade', val);
                    }}
                    placeholder="Enter any grade (e.g. W120, W334, S354, W180, etc.)"
                    className="input-field text-sm py-2.5 font-mono uppercase tracking-wider font-semibold placeholder:font-sans placeholder:normal-case placeholder:font-normal"
                    required
                  />
                  {form.grade && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-900 border border-brand-200">
                      {form.grade}
                    </span>
                  )}
                </div>

                {/* Preset Chips */}
                <div className="mt-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-brand-600">
                    <span>Quick Grade Presets:</span>
                    <span className="text-brand-400 font-normal">Click any to quick-select</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {availablePresetGrades.map((g) => {
                      const isSelected = (form.grade || '').toUpperCase() === g.toUpperCase();
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setField('grade', g);
                            if (!form.name || form.name.startsWith('Jumbo King')) {
                              autoFillGradeDetails(g);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-medium transition-all ${
                            isSelected
                              ? 'bg-brand-900 text-cream-50 border-brand-900 shadow-xs'
                              : 'bg-cream-100/80 hover:bg-cream-200 border-brand-200 text-brand-800'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Featured Badge</label>
                <input value={form.badge} onChange={(e) => setField('badge', e.target.value)} className="input-field text-xs sm:text-sm py-2.5" placeholder="e.g. Connoisseur Choice" />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">
                  Showcase Priority / Ranking
                </label>
                <input
                  type="number"
                  value={form.priority !== undefined ? form.priority : 0}
                  onChange={(e) => setField('priority', parseInt(e.target.value) || 0)}
                  className="input-field text-xs sm:text-sm py-2.5 font-mono"
                  placeholder="0 (Chronological)"
                />
                <p className="text-[10px] text-brand-500 mt-1">
                  Higher numbers (e.g. 10, 50, 100) pin this harvest to the front of the public store.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Product Display Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="input-field text-xs sm:text-sm py-2.5" placeholder="e.g. Jumbo King W180" required />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Short Tagline <span className="text-red-500">*</span></label>
                <input value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} className="input-field text-xs sm:text-sm py-2.5" placeholder="e.g. The largest, most exclusive cashew harvest" required />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Summary Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="input-field resize-none text-xs sm:text-sm" rows={2} required />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Long Detailed Narrative</label>
                <textarea value={form.longDescription} onChange={(e) => setField('longDescription', e.target.value)} className="input-field resize-none text-xs sm:text-sm" rows={3} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-brand-900 block">Harvest Location / Origin</label>
                  <span className="text-[10px] text-brand-500 font-normal">Optional</span>
                </div>
                <input
                  value={form.origin || ''}
                  onChange={(e) => setField('origin', e.target.value)}
                  className="input-field text-xs sm:text-sm py-2.5"
                  placeholder="e.g. Goa Coastal Belt, Karnataka Malnad"
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-brand-400">Presets:</span>
                  {['Goa Coastal Belt', 'Karnataka Malnad', 'Goa & Karnataka Coast'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setField('origin', loc)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 hover:bg-brand-200 text-brand-800 transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-brand-500 mt-1">
                  * Matches storefront location banners (e.g. Goa, Karnataka)
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Grade Size Specifications</label>
                <input value={form.gradeDescription} onChange={(e) => setField('gradeDescription', e.target.value)} className="input-field text-xs sm:text-sm py-2.5" placeholder="e.g. Approx 180 nuts per pound" />
              </div>
            </div>
          </div>

          {/* Card 2: Main Image & Gallery */}
          <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury space-y-4">
            <h2 className="font-serif text-base font-bold text-brand-950 border-b border-brand-100 pb-2">
              2. Photography & Visual Assets
            </h2>

            {/* Main Image */}
            <div>
              <label className="text-xs font-bold text-brand-900 mb-2 block">
                Primary Product Showcase Image <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-cream-50/60 border border-brand-100">
                {form.image ? (
                  <img src={form.image} alt="main preview" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-brand-300 shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-cream-200/70 flex items-center justify-center text-xs text-brand-400 shrink-0">
                    No image
                  </div>
                )}
                <div className="flex-1 space-y-2 w-full">
                  <input
                    value={form.image}
                    onChange={(e) => setField('image', e.target.value)}
                    className="input-field text-xs py-2 bg-white"
                    placeholder="Direct Image URL or upload from device below"
                  />
                  <button
                    type="button"
                    onClick={() => triggerUpload('image')}
                    disabled={!!uploadingField}
                    className="btn-outline text-xs py-2 px-4 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'image' ? 'Uploading to CDN...' : 'Upload Image File'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery Images */}
            <div className="pt-2">
              <label className="text-xs font-bold text-brand-900 mb-1.5 block">
                Secondary Gallery Shots (Up to 4)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-cream-50/60 border border-brand-100 space-y-2">
                    {form.gallery[idx] ? (
                      <img src={form.gallery[idx]} alt="" className="w-full h-20 rounded-xl object-cover ring-1 ring-brand-200" />
                    ) : (
                      <div className="w-full h-20 rounded-xl bg-cream-200/60 flex items-center justify-center text-xs text-brand-400">
                        Slot #{idx + 1}
                      </div>
                    )}
                    <input
                      value={form.gallery[idx] || ''}
                      onChange={(e) => { const g = [...form.gallery]; g[idx] = e.target.value; setField('gallery', g); }}
                      className="input-field text-[11px] py-1.5 bg-white"
                      placeholder={`URL ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => triggerUpload(`gallery-${idx}`)}
                      disabled={!!uploadingField}
                      className="btn-outline text-[11px] py-1.5 px-2 w-full"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingField === `gallery-${idx}` ? '...' : 'Upload'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Varieties & Multi-Tier Pricing */}
          <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury space-y-4">
            <h2 className="font-serif text-base font-bold text-brand-950 border-b border-brand-100 pb-2">
              3. Varieties & Tiered Weight Pricing (₹)
            </h2>
            <p className="text-xs text-brand-500">
              Toggle ON which varieties are available for this cashew grade. Set weight increments and customized INR pricing.
            </p>

            {/* Custom Variety Add Bar */}
            <div className="flex items-center gap-2 p-3 bg-cream-50/80 rounded-xl border border-brand-200">
              <input
                value={customVariety}
                onChange={(e) => setCustomVariety(e.target.value)}
                placeholder="Add custom variety (e.g. Crispy Fried, Pepper Masala, Ghee Roast)"
                className="input-field text-xs py-2 bg-white flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomVariety();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomVariety}
                className="btn-outline text-xs py-2 px-3 flex items-center gap-1 font-semibold shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-brand-700" />
                <span>Add Variety</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.types.map((t: any) => (
                <div
                  key={t.type}
                  className={`rounded-2xl border transition-all ${
                    t.enabled ? 'border-brand-400 bg-white shadow-sm' : 'border-brand-200/60 bg-cream-50/50'
                  }`}
                >
                  {/* Type Bar */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleType(t.type)}
                      className="shrink-0 transition-colors"
                    >
                      {t.enabled
                        ? <ToggleRight className="w-7 h-7 text-brand-700" />
                        : <ToggleLeft className="w-7 h-7 text-brand-300" />
                      }
                    </button>

                    <div className="flex-1">
                      <span className={`text-sm font-bold ${t.enabled ? 'text-brand-950' : 'text-brand-400'}`}>
                        {t.type}
                      </span>
                      <span className="text-xs text-brand-400 ml-2">
                        {t.enabled ? `(${t.prices?.length || 0} weight tiers configured)` : '(Disabled)'}
                      </span>
                    </div>

                    {t.enabled && (
                      <button
                        type="button"
                        onClick={() => setExpandedType(expandedType === t.type ? null : t.type)}
                        className="p-1.5 rounded-lg hover:bg-cream-100 text-brand-700 transition-colors"
                      >
                        {expandedType === t.type ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Pricing Editor */}
                  {t.enabled && expandedType === t.type && (
                    <div className="p-4 pt-2 border-t border-brand-100 space-y-4 animate-fade-in bg-cream-50/30">
                      {/* Variety Specific Image */}
                      <div>
                        <label className="text-xs font-bold text-brand-900 mb-1.5 block">
                          Variety Photo (Optional — uses main product photo if not specified)
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-white border border-brand-200">
                          <div className="w-16 h-16 rounded-xl bg-cream-100 flex items-center justify-center overflow-hidden border border-brand-200 shrink-0">
                            <img
                              src={t.image || form.image || '/cashew_single_nut.jpg'}
                              alt={t.type}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/cashew_single_nut.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            <input
                              type="text"
                              value={t.image || ''}
                              onChange={(e) => updateTypeField(t.type, 'image', e.target.value)}
                              placeholder="Image URL or upload custom photo below"
                              className="input-field text-xs py-1.5 bg-cream-50/50"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => triggerUpload(`type-${t.type}`)}
                                disabled={!!uploadingField}
                                className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{uploadingField === `type-${t.type}` ? 'Uploading...' : `Upload Photo for ${t.type}`}</span>
                              </button>
                              {t.image && (
                                <button
                                  type="button"
                                  onClick={() => updateTypeField(t.type, 'image', '')}
                                  className="text-[11px] text-red-600 hover:underline"
                                >
                                  Reset to Main Image
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-brand-900 mb-1 block">Variety Description</label>
                        <textarea
                          value={t.description}
                          onChange={(e) => updateTypeField(t.type, 'description', e.target.value)}
                          className="input-field text-xs bg-white"
                          rows={2}
                          placeholder="e.g. Slow-roasted to golden crunch with natural Himalayan rock salt..."
                        />
                      </div>

                      {/* Weight Rows */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-brand-900">Weights & Prices</label>
                          <button
                            type="button"
                            onClick={() => addQuantity(t.type)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-950"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add Tier</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {t.prices.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                value={p.quantity}
                                onChange={(e) => updateQuantityLabel(t.type, idx, e.target.value)}
                                className="input-field text-xs py-2 w-28 bg-white font-semibold"
                                placeholder="e.g. 500g"
                              />
                              <span className="text-brand-400 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                value={p.price}
                                onChange={(e) => updatePriceByIdx(t.type, idx, parseInt(e.target.value) || 0)}
                                className="input-field text-xs py-2 flex-1 bg-white font-bold"
                                placeholder="Price in INR"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => removeQuantity(t.type, idx)}
                                className="p-2 text-brand-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-3 px-8 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-900/20"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : editProduct ? 'Update Product Entry' : 'Create New Product'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-outline py-3 px-6 text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  const allOrigins = Array.from(
    new Set(
      products
        .map((p) => (p.origin ? p.origin.split(',')[0].trim() : ''))
        .filter(Boolean)
    )
  );

  const allGrades = Array.from(
    new Set(products.map((p) => (p.grade || '').trim().toUpperCase()).filter(Boolean))
  );

  const filteredAdminProducts = products.filter((p) => {
    const q = adminSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.grade && p.grade.toLowerCase().includes(q)) ||
      (p.origin && p.origin.toLowerCase().includes(q)) ||
      (p.types && p.types.some((t: any) => t.type && t.type.toLowerCase().includes(q)));

    const matchesGrade =
      filterGrade === 'ALL' ||
      (p.grade && p.grade.toUpperCase() === filterGrade.toUpperCase());

    const matchesOrigin =
      filterOrigin === 'ALL' ||
      (p.origin && p.origin.toLowerCase().includes(filterOrigin.toLowerCase()));

    return matchesSearch && matchesGrade && matchesOrigin;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight">
            Product Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-brand-500 mt-1">
            {products.length} cashew grades and regional harvests configured in active database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-forest-700" />
            <span>krisha_dry_fruits</span>
          </div>

          <button
            onClick={handleSyncWithAtlas}
            disabled={loading}
            className="btn-outline text-xs py-2 px-3.5 font-semibold flex items-center gap-1.5 shadow-sm"
            title="Sync products directly with database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={openAdd}
            className="btn-primary text-xs py-2 px-4.5 font-semibold flex items-center gap-1.5 shadow-md shadow-brand-900/15"
          >
            <Plus className="w-4 h-4" />
            <span>Add Grade / Product</span>
          </button>
        </div>
      </div>

      {/* Catalogue Filter & Search Bar */}
      <div className="card p-4 bg-white border border-brand-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Search by grade (e.g. W180), name, origin (Goa, Karnataka), or variety (Fried, Roasted)..."
              className="input-field text-xs sm:text-sm py-2 pl-9 bg-cream-50/50"
            />
            {adminSearch && (
              <button
                onClick={() => setAdminSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-400 hover:text-brand-900"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-brand-500 shrink-0 font-medium">
            Showing <strong className="text-brand-900">{filteredAdminProducts.length}</strong> of {products.length} products
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand-100 text-xs">
          <span className="text-brand-400 font-semibold text-[11px] uppercase tracking-wider">Filter Grade:</span>
          <button
            onClick={() => setFilterGrade('ALL')}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
              filterGrade === 'ALL'
                ? 'bg-brand-900 text-white font-bold'
                : 'bg-cream-100 hover:bg-cream-200 text-brand-700'
            }`}
          >
            All
          </button>
          {allGrades.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGrade(g)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                filterGrade === g
                  ? 'bg-brand-900 text-white font-bold'
                  : 'bg-cream-100 hover:bg-cream-200 text-brand-700'
              }`}
            >
              {g}
            </button>
          ))}

          {allOrigins.length > 0 && (
            <>
              <span className="text-brand-300 mx-1">|</span>
              <span className="text-brand-400 font-semibold text-[11px] uppercase tracking-wider">Origin:</span>
              <button
                onClick={() => setFilterOrigin('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  filterOrigin === 'ALL'
                    ? 'bg-forest-800 text-white font-bold'
                    : 'bg-cream-100 hover:bg-cream-200 text-brand-700'
                }`}
              >
                All Origins
              </button>
              {allOrigins.map((orig) => (
                <button
                  key={orig}
                  onClick={() => setFilterOrigin(orig)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filterOrigin === orig
                      ? 'bg-forest-800 text-white font-bold'
                      : 'bg-cream-100 hover:bg-cream-200 text-brand-700'
                  }`}
                >
                  📍 {orig}
                </button>
              ))}
            </>
          )}

          {(filterGrade !== 'ALL' || filterOrigin !== 'ALL' || adminSearch) && (
            <button
              onClick={() => {
                setFilterGrade('ALL');
                setFilterOrigin('ALL');
                setAdminSearch('');
              }}
              className="text-[11px] text-red-600 hover:text-red-800 underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-cream-200/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdminProducts.map((p, idx) => {
            const allPrices = (p.types || []).flatMap((t: any) => (t.prices || []).map((pr: any) => pr.price)).filter(Boolean);
            const minPrice = allPrices.length ? Math.min(...allPrices) : null;
            const activeVarieties = (p.types || []).filter((t: any) => t.enabled !== false).map((t: any) => t.type);

            return (
              <div
                key={p._id || p.id}
                className={`card overflow-hidden bg-white border border-brand-200/70 shadow-luxury flex flex-col justify-between transition-all ${
                  p.active === false ? 'opacity-65' : ''
                }`}
              >
                <div>
                  <div className="relative h-44 bg-cream-200/60 overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-brand-400">
                        No image
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center rounded-full bg-brand-950/90 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-cream-50 border border-white/20 shadow-sm">
                        {p.badge || 'Premium'}
                      </span>
                      {p.grade && (
                        <span className="inline-flex items-center rounded-full bg-cream-100/95 backdrop-blur-md px-2 py-0.5 text-xs font-mono font-bold text-brand-900 border border-brand-300 shadow-sm">
                          {p.grade}
                        </span>
                      )}
                      {typeof p.priority === 'number' && p.priority > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-amber-300 shadow-sm">
                          ⭐ Rank #{p.priority}
                        </span>
                      )}
                    </div>

                    {p.active === false && (
                      <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                          Hidden from Store
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider font-mono">
                        {p.grade} Grade
                      </span>
                      {p.origin && (
                        <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200 truncate">
                          📍 {p.origin.split(',')[0].trim()}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-brand-950 mb-1 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-brand-600 mb-3 line-clamp-1">
                      {p.tagline}
                    </p>

                    <div className="text-xs font-semibold text-brand-900 bg-cream-100/70 p-2.5 rounded-xl border border-brand-200/60 flex items-center justify-between mb-3">
                      <span>{minPrice ? `From ${formatPrice(minPrice)}` : 'Pricing unconfigured'}</span>
                      <span className="text-brand-600 font-medium">
                        {activeVarieties.length} {activeVarieties.length === 1 ? 'variety' : 'varieties'}
                      </span>
                    </div>

                    {activeVarieties.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[10.5px]">
                        {activeVarieties.map((v: string) => (
                          <span key={v} className="px-2 py-0.5 rounded-md bg-cream-200/70 text-brand-800 font-medium">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 flex flex-col gap-2.5">
                  {/* Quick Reordering Toolbar */}
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-cream-100/70 border border-brand-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-700 font-medium pl-1">
                      <span>Priority:</span>
                      <strong className="font-mono text-brand-950 font-bold">{p.priority || 0}</strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePinProductToTop(p)}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition-colors border border-amber-300"
                        title="Pin this product to the top of the store"
                      >
                        ⭐ Pin Top
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveProductUp(p, idx)}
                        disabled={idx === 0}
                        className="p-1 rounded-lg border border-brand-200 bg-white hover:bg-cream-200 disabled:opacity-25 disabled:pointer-events-none text-brand-800 transition-colors"
                        title="Move this product higher / earlier"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveProductDown(p, idx)}
                        disabled={idx === filteredAdminProducts.length - 1}
                        className="p-1 rounded-lg border border-brand-200 bg-white hover:bg-cream-200 disabled:opacity-25 disabled:pointer-events-none text-brand-800 transition-colors"
                        title="Move this product lower / later"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 btn-outline text-xs py-2 font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => duplicateProductForNewStock(p)}
                      className="p-2 rounded-xl border border-brand-200 text-brand-700 hover:bg-cream-100 transition-colors"
                      title="Duplicate this grade to add stock for a new variety (e.g. Fried, Roasted) or new origin (e.g. Karnataka)"
                    >
                      <Copy className="w-4 h-4 text-brand-700" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(p)}
                      className="p-2 rounded-xl border border-brand-200 text-brand-700 hover:bg-cream-100 transition-colors"
                      title={p.active !== false ? 'Hide from storefront' : 'Make visible in store'}
                    >
                      {p.active !== false ? <Eye className="w-4 h-4 text-forest-700" /> : <EyeOff className="w-4 h-4 text-brand-400" />}
                    </button>

                    <button
                      onClick={() => handleDelete(p._id || p.id)}
                      className="p-2 rounded-xl border border-brand-200 text-brand-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAdminProducts.length === 0 && (
            <div className="col-span-full card p-12 text-center bg-white border border-brand-200 shadow-luxury">
              <Database className="w-10 h-10 text-brand-400 mx-auto mb-3" />
              <p className="font-serif text-lg font-bold text-brand-950 mb-2">
                {products.length === 0 ? 'Database Catalog is Empty' : 'No matching products found'}
              </p>
              <p className="text-xs text-brand-500 mb-6 max-w-md mx-auto">
                {products.length === 0
                  ? 'Your MongoDB database currently has 0 products. You can create custom grades anytime or populate defaults.'
                  : 'Try clearing your search or filters, or add a new grade product.'}
              </p>
              {products.length > 0 && (
                <button onClick={() => { setFilterGrade('ALL'); setFilterOrigin('ALL'); setAdminSearch(''); }} className="btn-primary py-2 px-5 text-xs mr-2">
                  Reset Filters
                </button>
              )}
              <button onClick={openAdd} className="btn-primary py-2 px-5 text-xs">
                Add Grade / Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modern In-App Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in flex items-center gap-3 px-4 py-3 rounded-2xl shadow-luxury-lg border bg-white max-w-md transition-all">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          {toast.type === 'info' && <Database className="w-5 h-5 text-brand-600 shrink-0" />}
          <span className="text-xs font-semibold text-brand-950 flex-1 leading-snug">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
