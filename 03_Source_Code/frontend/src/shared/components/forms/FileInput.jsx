import React, { useRef } from 'react';
import { UploadSimple, FilePdf, X } from '@phosphor-icons/react';

export default function FileInput({ 
  label, 
  error, 
  file, 
  onFileChange, 
  onFileRemove,
  accept = ".pdf",
  description = "Format PDF. Ukuran maksimal 15MB."
}) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-gray-700">{label}</label>}
      <div 
        className={`border-2 border-dashed rounded-xl p-6 transition-colors flex flex-col items-center justify-center cursor-pointer ${
          error ? 'border-red-400 bg-red-50' : 
          file ? 'border-accent bg-accent/5' : 
          'border-gray-300 hover:border-accent hover:bg-gray-50'
        }`}
        onClick={handleClick}
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileChange(e.target.files[0]);
            }
          }}
          accept={accept}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center text-center">
            <div className="bg-white p-3 rounded-full shadow-sm mb-3">
              <FilePdf size={32} weight="fill" className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 break-all px-4">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="mt-4 px-4 py-1.5 bg-white border border-gray-200 text-red-500 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <X size={14} weight="bold" /> Hapus File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-accent border border-gray-100">
              <UploadSimple size={24} weight="bold" />
            </div>
            <p className="text-sm font-bold text-gray-700">Klik untuk mengunggah dokumen</p>
            <p className="text-xs text-gray-500 mt-1.5">{description}</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-red-500 mt-1">{error}</p>}
    </div>
  );
}
