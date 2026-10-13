import React, { useState, useEffect } from 'react';
import { Clock, FolderOpen, ArrowRight } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FileCard from '../components/FileCard';
import ShareModal from '../components/ShareModal';
import { FileCardSkeleton } from '../components/LoadingSkeleton';
import { dashboardApi } from '../api/dashboard';
import { filesApi } from '../api/files';

const RecentFilesPage = () => {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShareFile, setActiveShareFile] = useState(null);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setRecentFiles(data.recent_files || []);
    } catch (err) {
      console.error('Failed to fetch recent files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleDownload = async (file) => {
    try {
      await filesApi.downloadFile(file.id, file.original_filename);
    } catch {
      alert('Failed to download file.');
    }
  };

  return (
    <AppLayout onUploadSuccess={fetchRecent}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recent Files</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quickly locate files you recently uploaded or modified in CloudVault
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FileCardSkeleton key={i} />
            ))}
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No recent activity</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Files uploaded to your storage vault will be displayed chronologically here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
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
        onShareUpdated={fetchRecent}
      />
    </AppLayout>
  );
};

export default RecentFilesPage;
