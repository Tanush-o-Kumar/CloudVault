import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { filesApi } from '../api/files';

const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt', 'md', 'csv', 'json', 'docx', 'xlsx', 'pptx', 'zip'];

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const validateFile = (file) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!file) return false;

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg(`File exceeds the maximum limit of ${MAX_SIZE_MB} MB (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`);
      return false;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.includes(ext)) {
      setErrorMsg(`Unsupported file type '.${ext}'. Supported formats: ${ALLOWED_EXTS.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await filesApi.uploadFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setSuccessMsg(`"${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      setTimeout(() => {
        onUploadSuccess && onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'File upload failed. Please try again.';
      setErrorMsg(detail);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setErrorMsg('');
      setSuccessMsg('');
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Upload File</h3>
            <p className="text-xs text-slate-500">Encrypted in transit & at rest with AWS S3</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
              disabled={isUploading}
            />

            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Drag & drop your file here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Maximum file size: {MAX_SIZE_MB} MB
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Supported: PDF, Images, Word, Excel, ZIP, TXT, CSV
            </p>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-xs text-slate-400 hover:text-red-600 font-medium px-2 py-1"
                >
                  Remove
                </button>
              )}
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Uploading to S3...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isUploading ? 'Uploading...' : 'Confirm Upload'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
