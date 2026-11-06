import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface CategoryMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  allCategories: Array<{ id: string; label: string }>;
}

export default function CategoryMultiSelect({
  selectedIds,
  onChange,
  allCategories,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((x) => x !== id));
  };

  const selectAll = () => onChange(allCategories.map((c) => c.id));
  const clearAll = () => onChange([]);

  return (
    <div ref={containerRef} className="relative">
      {/* Sleek Input-style Trigger Field */}
      <div
        onClick={() => setOpen(!open)}
        className={`w-full min-h-[42px] px-3 py-1.5 bg-white rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
          open
            ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-xs'
            : 'border-brand-200 hover:border-brand-400'
        }`}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 py-0.5">
          {selectedIds.length === 0 ? (
            <span className="text-xs text-brand-400 font-normal">
              Click to choose categories for this card...
            </span>
          ) : (
            selectedIds.map((id) => {
              const cat = allCategories.find((c) => c.id === id);
              const label = cat ? cat.label.split('(')[0].trim() : id;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-900 border border-brand-200 transition-colors animate-fade-in"
                >
                  <span>{label}</span>
                  <span
                    onClick={(e) => removeOne(e, id)}
                    className="hover:text-red-600 hover:bg-brand-200/60 rounded p-0.5 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-1.5 text-brand-400 shrink-0 ml-1">
          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
            {selectedIds.length}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-brand-500 transition-transform duration-200 ${
              open ? 'rotate-180 text-brand-800' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown Popover */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-brand-200 shadow-luxury-lg overflow-hidden animate-fade-in">
          {/* Header Actions */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-cream-50/90 border-b border-brand-100 text-[11px]">
            <span className="font-bold text-brand-900">
              Select Categories ({selectedIds.length} of {allCategories.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-brand-700 hover:text-brand-950 font-semibold hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-brand-300">·</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-brand-500 hover:text-red-600 font-semibold hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Scrollable Categories List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {allCategories.map((c) => {
              const isChecked = selectedIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-brand-50 text-brand-950 font-semibold'
                      : 'hover:bg-cream-100/70 text-brand-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                        isChecked
                          ? 'bg-brand-900 text-cream-50 border border-brand-900 shadow-xs'
                          : 'border border-brand-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{c.label}</span>
                  </div>
                  {isChecked && (
                    <span className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider">
                      Included
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Done Button */}
          <div className="p-2 border-t border-brand-100 bg-cream-50/50 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-primary py-1 px-4 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

