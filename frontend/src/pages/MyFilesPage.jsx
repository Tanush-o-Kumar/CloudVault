import React, { useState, useEffect } from 'react';
import {
  Search,
  Grid,
  List,
  UploadCloud,
  FolderOpen,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FileCard from '../components/FileCard';
import FileRow from '../components/FileRow';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import ConfirmModal from '../components/ConfirmModal';
import { filesApi } from '../api/files';

const MyFilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeShareFile, setActiveShareFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await filesApi.getFiles({
        q: searchQuery,
        type: selectedType,
      });
      setFiles(data.items || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFiles();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedType]);

  const handleDownload = async (file) => {
    try {
      await filesApi.downloadFile(file.id, file.original_filename);
    } catch {
      alert('Failed to download file. Access might have expired.');
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await filesApi.deleteFile(fileToDelete.id);
      setToastMsg(`Deleted "${fileToDelete.original_filename}"`);
      setTimeout(() => setToastMsg(''), 3000);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err) {
      alert('Failed to delete file.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar onUploadClick={() => setIsUploadOpen(true)} />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Files</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage your cloud storage documents, photos, and backups
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>

          {/* Toast message */}
          {toastMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium animate-in fade-in">
              {toastMsg}
            </div>
          )}

          {/* Controls Bar: Search, Type filter, View mode toggle */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Filter pills & View Mode */}
            <div className="flex items-center justify-between w-full md:w-auto gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'document', label: 'Documents' },
                  { id: 'image', label: 'Images' },
                  { id: 'archive', label: 'Archives' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedType(tab.id)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedType === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-slate-600">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List View"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Files Content */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm">Fetching files from vault...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base">No files found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No files match your search "${searchQuery}".`
                  : 'You have not uploaded any files yet.'}
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload a File Now</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDownload={handleDownload}
                  onShare={(f) => setActiveShareFile(f)}
                  onDelete={(f) => setFileToDelete(f)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onDownload={handleDownload}
                  onShare={(f) => setActiveShareFile(f)}
                  onDelete={(f) => setFileToDelete(f)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchFiles}
      />

      <ShareModal
        isOpen={!!activeShareFile}
        file={activeShareFile}
        onClose={() => setActiveShareFile(null)}
        onShareUpdated={fetchFiles}
      />

      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete File Permanently?"
        message={`Are you sure you want to delete "${fileToDelete?.original_filename}"? This action removes the object from Amazon S3 and PostgreSQL and cannot be undone.`}
        confirmText="Yes, Delete File"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
};

export default MyFilesPage;
