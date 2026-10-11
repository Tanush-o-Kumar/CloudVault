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
  Loader2,
  Download,
  Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import { formatBytes, formatDate, getFileIcon } from '../components/FileCard';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboard';
import { filesApi } from '../api/files';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeShareFile, setActiveShareFile] = useState(null);

  const fetchStats = async () => {
    try {
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar onUploadClick={() => setIsUploadOpen(true)} />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Here is a summary of your cloud storage usage and recent activity.
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New File</span>
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm">Loading vault metrics...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Files */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Files</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FolderOpen className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stats?.total_files || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">Stored securely in S3</p>
                </div>

                {/* Storage Used */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider">Storage Used</span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <HardDrive className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatBytes(stats?.total_storage_bytes || 0)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>{stats?.storage_percentage || 0}% of quota</span>
                  </div>
                </div>

                {/* Shares Received */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider">Shared With Me</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Share2 className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.shares_received_count || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Accessible files</p>
                </div>

                {/* Shares Sent */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider">Shared By Me</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Share2 className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.shares_sent_count || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Active outbound shares</p>
                </div>
              </div>

              {/* File Type Summaries */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                  File Type Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Docs</div>
                      <div className="text-base font-bold text-slate-800">{stats?.file_type_distribution?.Documents || 0}</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Images</div>
                      <div className="text-base font-bold text-slate-800">{stats?.file_type_distribution?.Images || 0}</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Archive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Archives</div>
                      <div className="text-base font-bold text-slate-800">{stats?.file_type_distribution?.Archives || 0}</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Code className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Code/Text</div>
                      <div className="text-base font-bold text-slate-800">{stats?.file_type_distribution?.['Code/Text'] || 0}</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Other</div>
                      <div className="text-base font-bold text-slate-800">{stats?.file_type_distribution?.Other || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Files Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">Recent Uploads</h3>
                    <p className="text-xs text-slate-500">Your latest uploaded documents and media</p>
                  </div>
                  <Link
                    to="/files"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>View all files</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {!stats?.recent_files || stats.recent_files.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No files uploaded yet</p>
                    <p className="text-xs text-slate-400 mt-1">Upload your first file to see it here.</p>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stats.recent_files.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3 overflow-hidden pr-4">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {getFileIcon(file.content_type)}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-semibold text-slate-800 truncate">{file.original_filename}</p>
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

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActiveShareFile(file)}
                            title="Share"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            title="Download"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
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
          )}
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchStats}
      />

      <ShareModal
        isOpen={!!activeShareFile}
        file={activeShareFile}
        onClose={() => setActiveShareFile(null)}
        onShareUpdated={fetchStats}
      />
    </div>
  );
};

export default DashboardPage;
