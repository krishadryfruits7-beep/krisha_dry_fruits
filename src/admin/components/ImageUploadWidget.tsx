import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, X, Check, Cloud } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

interface ImageUploadWidgetProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'landscape' | 'square' | 'wide';
  helpText?: string;
}

export default function ImageUploadWidget({
  label,
  value,
  onChange,
  aspectRatio = 'landscape',
  helpText,
}: ImageUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is larger than 10MB. Please choose a smaller photo.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        onChange(url);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : 'aspect-[16/9]';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-brand-900 block">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-brand-500 hover:text-brand-900 transition-colors"
        >
          {showManualUrl ? 'Hide URL input' : 'Paste URL directly'}
        </button>
      </div>

      {helpText && (
        <p className="text-[11px] text-brand-500">{helpText}</p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Image Preview Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full sm:w-44 ${aspectClass} rounded-2xl overflow-hidden border-2 border-dashed border-brand-200 hover:border-brand-500 bg-cream-50 cursor-pointer group transition-all shrink-0 flex items-center justify-center shadow-sm`}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  (e.currentTarget as HTMLImageElement).src = '/hero_cashew_bowl.jpg';
                }}
              />
              <div className="absolute inset-0 bg-brand-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">Change Photo</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-brand-400 p-4 text-center">
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-[11px] font-medium">Click to upload photo</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-brand-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-300" />
              <span className="text-[10px] font-semibold">Uploading...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 active:scale-95 text-cream-50 text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{value ? 'Upload New Image' : 'Select Image from Computer'}</span>
                </>
              )}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-brand-500">
            <Cloud className="w-3.5 h-3.5 text-brand-600" />
            <span>Automatic Cloudinary upload with responsive optimization</span>
          </div>

          {showManualUrl && (
            <div className="pt-2 animate-fade-in">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://res.cloudinary.com/... or /image.jpg"
                className="input-field text-xs font-mono py-2"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
