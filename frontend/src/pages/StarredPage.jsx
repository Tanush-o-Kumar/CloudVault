import React, { useState, useEffect } from 'react';
import { Star, FolderOpen } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FileCard from '../components/FileCard';
import ShareModal from '../components/ShareModal';
import { FileCardSkeleton } from '../components/LoadingSkeleton';
import { filesApi } from '../api/files';

const StarredPage = () => {
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShareFile, setActiveShareFile] = useState(null);
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
      const data = await filesApi.getFiles();
      setAllFiles(data.items || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const starredFiles = allFiles.filter((f) => starredIds.includes(f.id));

  const handleToggleStar = (file) => {
    setStarredIds((prev) => {
      const updated = prev.filter((id) => id !== file.id);
      localStorage.setItem('cloudvault_starred', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDownload = async (file) => {
    try {
      await filesApi.downloadFile(file.id, file.original_filename);
    } catch {
      alert('Failed to download file.');
    }
  };

  return (
    <AppLayout onUploadSuccess={fetchFiles}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Starred Files</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your bookmarked documents and high-priority assets for rapid access
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FileCardSkeleton key={i} />
            ))}
          </div>
        ) : starredFiles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-3">
              <Star className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No starred files yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click the star icon on any document or photo in My Files to bookmark it here for quick access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {starredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isStarred={true}
                onToggleStar={handleToggleStar}
                onDownload={handleDownload}
                onShare={(f) => setActiveShareFile(f)}
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
    </AppLayout>
  );
};

export default StarredPage;
