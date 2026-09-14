import React, { useRef, useState } from 'react';
import { Upload, Camera, X, Image } from 'lucide-react';
import { clsx } from 'clsx';

const FileUploader = ({
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 10,
  preview,
  onRemove,
  label = 'Upload Image',
  helper = 'JPG, PNG, WEBP up to 10MB',
}) => {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validate = (file) => {
    setError('');
    if (!file) return false;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, WEBP files are allowed');
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be under ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
    if (validate(file)) onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-forest/20 group">
        <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-white/90 text-charcoal px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500"
          >
            Remove
          </button>
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors',
          dragOver ? 'border-forest bg-forest/5' : 'border-cream-darker hover:border-forest/40 hover:bg-cream/50'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-cream flex items-center justify-center">
            <Image className="h-6 w-6 text-forest" />
          </div>
          <div>
            <p className="font-semibold text-charcoal text-sm">{label}</p>
            <p className="text-xs text-charcoal-lighter mt-1">{helper}</p>
            <p className="text-xs text-charcoal-lighter">Drag & drop or click to browse</p>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              className="flex items-center gap-1.5 text-xs bg-forest text-white px-3 py-1.5 rounded-lg font-medium"
            >
              <Upload className="h-3 w-3" /> Browse
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
              className="flex items-center gap-1.5 text-xs bg-cream border border-cream-darker text-charcoal px-3 py-1.5 rounded-lg font-medium"
            >
              <Camera className="h-3 w-3" /> Camera
            </button>
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
};

export default FileUploader;
