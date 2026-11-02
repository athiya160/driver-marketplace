import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Trash2,
  Sparkles,
  Camera,
  Car,
  UserCheck
} from 'lucide-react';

export default function PhotoUploadModal({
  isOpen,
  onClose,
  onUploadComplete
}) {
  const [activeTab, setActiveTab] = useState('vehicle'); // 'vehicle', 'driver_kyc', 'profile'
  const [selectedCategory, setSelectedCategory] = useState('exterior'); // 'exterior', 'interior', '360_view'
  const [uploadedImages, setUploadedImages] = useState([
    {
      id: 'img_1',
      type: 'vehicle',
      category: '360_view',
      title: 'Mercedes GLC 300 4MATIC (Front Angle)',
      url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
      size: '1.8 MB',
      verified: true
    },
    {
      id: 'img_2',
      type: 'vehicle',
      category: 'interior',
      title: 'Black Leather Cabin & Console',
      url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
      size: '2.1 MB',
      verified: true
    }
  ]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Simulate upload to Supabase / Cloudinary / AWS S3
  const handleSaveUpload = () => {
    if (!previewUrl) return;

    setIsUploading(true);
    setTimeout(() => {
      const newImg = {
        id: `img_${Date.now()}`,
        type: activeTab,
        category: selectedCategory,
        title: activeTab === 'vehicle' 
          ? `Luxury Vehicle (${selectedCategory.replace('_', ' ').toUpperCase()})` 
          : 'Verified Chauffeur Document',
        url: previewUrl,
        size: '2.4 MB',
        verified: true
      };

      setUploadedImages(prev => [newImg, ...prev]);
      setIsUploading(false);
      setUploadSuccess(true);
      setPreviewUrl(null);

      if (onUploadComplete) onUploadComplete(newImg);

      setTimeout(() => setUploadSuccess(false), 2500);
    }, 1000);
  };

  const handleRemoveImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0b1c16] border border-emerald-800/60 w-full max-w-lg rounded-3xl p-5 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-emerald-950/80 text-emerald-300 hover:text-white transition z-10 border border-emerald-700/50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-white">Upload Photos & Documents</h2>
            <p className="text-xs text-emerald-300/80">Luxury Car 360° Shots, Chauffeur KYC & Profile Pictures</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-emerald-950/90 p-1 border border-emerald-800/50 mb-4 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('vehicle'); setPreviewUrl(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'vehicle'
                ? 'bg-[#0F4C3A] text-white shadow-md'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vehicle & 360° Photos</span>
          </button>
          <button
            onClick={() => { setActiveTab('driver_kyc'); setPreviewUrl(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'driver_kyc'
                ? 'bg-[#0F4C3A] text-white shadow-md'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chauffeur KYC Docs</span>
          </button>
        </div>

        {/* Category Pill for Vehicle */}
        {activeTab === 'vehicle' && (
          <div className="flex items-center gap-2 mb-3 text-[11px]">
            <span className="text-emerald-400 font-semibold">Photo Type:</span>
            {['360_view', 'exterior', 'interior'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full border transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-400'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                {cat === '360_view' ? '🔄 360° Exterior' : cat === 'interior' ? '🛋️ Luxury Interior' : '🚗 Side Profile'}
              </button>
            ))}
          </div>
        )}

        {/* Drag and Drop Upload Area */}
        <div
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="border-2 border-dashed border-emerald-600/50 hover:border-emerald-400 bg-emerald-950/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center mb-4 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-[#0F4C3A]/60 border border-emerald-500/50 flex items-center justify-center text-emerald-300 mb-2 group-hover:scale-110 transition">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-white mb-0.5">
            Click to Browse or Drag & Drop Image
          </p>
          <p className="text-[10px] text-emerald-300/70">
            Supports High-Resolution JPG, PNG, WEBP (Up to 15MB)
          </p>
        </div>

        {/* Live File Preview if chosen */}
        {previewUrl && (
          <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-2xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Image Preview Ready
              </span>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Cancel
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden max-h-48 border border-emerald-800 mb-3 bg-black">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-full h-44 object-contain"
              />
              <span className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                {selectedCategory === '360_view' ? '360° Tagged' : 'High Quality'}
              </span>
            </div>

            <button
              onClick={handleSaveUpload}
              disabled={isUploading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isUploading ? (
                <span>Uploading to Cloud Storage...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Attach to Fleet Profile</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {uploadSuccess && (
          <div className="bg-emerald-900/60 border border-emerald-500/60 rounded-xl p-2.5 mb-4 text-center text-xs font-bold text-emerald-200 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Image uploaded successfully & synced to database!</span>
          </div>
        )}

        {/* Gallery of Uploaded Fleet Photos & KYC Docs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Attached Photos & Documents ({uploadedImages.length})
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
              Cloud Synced ✓
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {uploadedImages.map(img => (
              <div
                key={img.id}
                className="flex items-center gap-3 p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl hover:border-emerald-600 transition"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-12 h-12 rounded-lg object-cover border border-emerald-700/60 shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{img.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-300/70">
                    <span>{img.size}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{img.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className="p-1.5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Explainer Box */}
        <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[10px] text-emerald-300/80 space-y-1">
          <p className="font-bold text-white flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Storage Architecture:
          </p>
          <p>• In Production: Connected to <strong>Supabase Storage</strong> / <strong>AWS S3</strong> / <strong>Cloudinary</strong> bucket.</p>
          <p>• Automated image compression, responsive WebP generation, and CDN URL delivery.</p>
        </div>

      </div>
    </div>
  );
}
