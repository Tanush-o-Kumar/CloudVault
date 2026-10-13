import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  HardDrive,
  Share2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Archive,
  Code,
  ArrowRight,
  Download,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import ShareModal from '../components/ShareModal';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { formatBytes, formatDate, getFileIcon } from '../components/FileCard';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboard';
import { filesApi } from '../api/files';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeShareFile, setActiveShareFile] = useState(null);
  const [starredIds, setStarredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cloudvault_starred') || '[]');
    } catch {
      return [];
    }
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownload = async (file) => {
    try {
      await filesApi.downloadFile(file.id, file.original_filename);
    } catch {
      alert('Failed to download file.');
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

  return (
    <AppLayout onUploadSuccess={fetchStats}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AWS S3 Encrypted Storage Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Access your cloud files, inspect your allocated storage quota, and collaborate securely with registered team members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/files"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xs hover:shadow-md transition duration-150"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Browse All Files</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Files */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Files</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats?.total_files || 0}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Indexed in PostgreSQL</span>
              </p>
            </div>

            {/* Storage Used */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Storage Used</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatBytes(stats?.total_storage_bytes || 0)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{stats?.storage_percentage || 0}% of {formatBytes(stats?.storage_limit_bytes || 500 * 1024 * 1024)} quota</span>
              </div>
            </div>

            {/* Recent Uploads */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Uploads</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats?.recent_files?.length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Last 5 activities logged</span>
              </p>
            </div>

            {/* Shared Files */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Shared Files</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {(stats?.shares_received_count || 0) + (stats?.shares_sent_count || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.shares_received_count || 0} inbound • {stats?.shares_sent_count || 0} outbound
              </p>
            </div>
          </div>
        )}

        {/* File Type Distribution Cards */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              File Category Distribution
            </h3>
            <span className="text-xs text-slate-400">Sorted by MIME groups</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Documents</div>
                <div className="text-lg font-bold text-slate-900">{stats?.file_type_distribution?.Documents || 0}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Images</div>
                <div className="text-lg font-bold text-slate-900">{stats?.file_type_distribution?.Images || 0}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Archives</div>
                <div className="text-lg font-bold text-slate-900">{stats?.file_type_distribution?.Archives || 0}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Code & Text</div>
                <div className="text-lg font-bold text-slate-900">{stats?.file_type_distribution?.['Code/Text'] || 0}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Other</div>
                <div className="text-lg font-bold text-slate-900">{stats?.file_type_distribution?.Other || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Uploads Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Uploads</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most recently stored files in your secure Amazon S3 partition</p>
            </div>
            <Link
              to="/files"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition"
            >
              <span>View all files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : !stats?.recent_files || stats.recent_files.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-slate-800 text-base">No files uploaded yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Upload your first document or image to start managing files in CloudVault.
              </p>
              <Link
                to="/files"
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Go to File Manager</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recent_files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden pr-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getFileIcon(file.content_type)}
                    </div>
                    <div className="truncate min-w-0">
                      <p
                        className="text-sm font-semibold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                        title={file.original_filename}
                        onClick={() => handleDownload(file)}
                      >
                        {file.original_filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{formatBytes(file.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(file.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setActiveShareFile(file)}
                      title="Share"
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      title="Download"
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={!!activeShareFile}
        file={activeShareFile}
        onClose={() => setActiveShareFile(null)}
        onShareUpdated={fetchStats}
      />
    </AppLayout>
  );
};

export default DashboardPage;
