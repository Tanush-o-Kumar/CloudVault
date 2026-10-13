import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Grid,
  List,
  UploadCloud,
  FolderOpen,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  HardDrive,
  Share2,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FileCard from '../components/FileCard';
import FileRow from '../components/FileRow';
import ShareModal from '../components/ShareModal';
import ConfirmModal from '../components/ConfirmModal';
import { FileCardSkeleton, FileRowSkeleton } from '../components/LoadingSkeleton';
import { filesApi } from '../api/files';

const MyFilesPage = () => {
  const location = useLocation();
  const searchParam = new URLSearchParams(location.search).get('q') || '';

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at'); // 'name' | 'created_at' | 'file_size'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [activeShareFile, setActiveShareFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [starredIds, setStarredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cloudvault_starred') || '[]');
    } catch {
      return [];
    }
  });

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
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedType]);

  const handleDownload = async (file) => {
    try {
      await filesApi.downloadFile(file.id, file.original_filename);
    } catch {
      alert('Failed to download file.');
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
    } catch {
      alert('Failed to delete file.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStar = (file) => {
    setStarredIds((prev) => {
      const updated = prev.includes(file.id)
        ? prev.filter((id) => id !== file.id)
        : [...prev, file.id];
      localStorage.setItem('cloudvault_starred', JSON.stringify(updated));
      return updated;
    });
  };

  // Client-side sorting logic
  const sortedFiles = [...files].sort((a, b) => {
    let result = 0;
    if (sortBy === 'name') {
      result = a.original_filename.localeCompare(b.original_filename);
    } else if (sortBy === 'file_size') {
      result = a.file_size - b.file_size;
    } else {
      result = new Date(a.created_at) - new Date(b.created_at);
    }
    return sortDirection === 'asc' ? result : -result;
  });

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <AppLayout
      onUploadSuccess={fetchFiles}
      searchQuery={searchQuery}
      onSearch={(q) => setSearchQuery(q)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Files</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage, organize, and inspect your encrypted cloud documents
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-medium animate-in fade-in flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Toolbar: Category Filters, Sorting, and View Switcher */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* File Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'document', label: 'Documents' },
              { id: 'image', label: 'Images' },
              { id: 'archive', label: 'Archives' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Controls: Sort & Grid/List View Toggle */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            {/* Sort Menu */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1">
              <span className="text-xs text-slate-400 font-medium pl-1">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="created_at">Date Modified</option>
                <option value="name">File Name</option>
                <option value="file_size">File Size</option>
              </select>

              <button
                onClick={toggleSortDirection}
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-slate-600">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Files Content Area */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <FileCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <FileRowSkeleton key={i} />
              ))}
            </div>
          )
        ) : sortedFiles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No files matching criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No files match your query "${searchQuery}".`
                : 'Your storage vault is currently empty.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isStarred={starredIds.includes(file.id)}
                onToggleStar={handleToggleStar}
                onDownload={handleDownload}
                onShare={(f) => setActiveShareFile(f)}
                onDelete={(f) => setFileToDelete(f)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {sortedFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                isStarred={starredIds.includes(file.id)}
                onToggleStar={handleToggleStar}
                onDownload={handleDownload}
                onShare={(f) => setActiveShareFile(f)}
                onDelete={(f) => setFileToDelete(f)}
              />
            ))}
          </div>
        )}
      </div>

      <ShareModal
        isOpen={!!activeShareFile}
        file={activeShareFile}
        onClose={() => setActiveShareFile(null)}
        onShareUpdated={fetchFiles}
      />

      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete File Permanently?"
        message={`Are you sure you want to delete "${fileToDelete?.original_filename}"? This object will be permanently removed from Amazon S3 and PostgreSQL.`}
        confirmText="Yes, Delete File"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </AppLayout>
  );
};

export default MyFilesPage;
