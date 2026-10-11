import React, { useState, useEffect } from 'react';
import {
  Share2,
  Download,
  Trash2,
  User,
  Clock,
  FolderOpen,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { formatBytes, formatDate, getFileIcon } from '../components/FileCard';
import { sharesApi } from '../api/shares';
import { filesApi } from '../api/files';

const SharedFilesPage = () => {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [receivedShares, setReceivedShares] = useState([]);
  const [sentShares, setSentShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'received') {
        const data = await sharesApi.getReceivedShares();
        setReceivedShares(data);
      } else {
        const data = await sharesApi.getSentShares();
        setSentShares(data);
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDownload = async (fileId, filename) => {
    try {
      await filesApi.downloadFile(fileId, filename);
    } catch {
      alert('Unable to download shared file. Sharing permission may have been revoked.');
      loadData();
    }
  };

  const handleRevoke = async (fileId, shareId) => {
    try {
      await sharesApi.revokeShare(fileId, shareId);
      setToastMsg('Share permission revoked immediately.');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
    } catch {
      alert('Failed to revoke share permission.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shared Files</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Securely access files shared with you and manage your outbound file authorizations
            </p>
          </div>

          {toastMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium animate-in fade-in">
              {toastMsg}
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('received')}
              className={`pb-3 px-2 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'received'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Shared with me</span>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-3 px-2 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'sent'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4 rotate-180" />
              <span>Shared by me</span>
            </button>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm">Loading sharing authorizations...</p>
            </div>
          ) : activeTab === 'received' ? (
            /* Received Shares */
            receivedShares.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Share2 className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base">No shared files</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When other registered CloudVault users share files with your email, they will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                {receivedShares.map((item) => (
                  <div
                    key={item.share_id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden pr-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {getFileIcon(item.content_type)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {item.original_filename}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{formatBytes(item.file_size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            By {item.owner_name} ({item.owner_email})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.shared_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownload(item.file_id, item.original_filename)}
                        title="Download authorized file"
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Sent Shares */
            sentShares.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Share2 className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base">No active outbound shares</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You have not shared any files with other users yet. Go to My Files to share.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                {sentShares.map((item) => (
                  <div
                    key={item.share_id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="overflow-hidden pr-4">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.original_filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-slate-600 font-medium">
                          Shared with {item.recipient_name} ({item.recipient_email})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.shared_at)}
                        </span>
                        <span>•</span>
                        {item.is_active ? (
                          <span className="text-emerald-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-500 font-medium">Revoked</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.is_active && (
                        <button
                          onClick={() => handleRevoke(item.file_id, item.share_id)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default SharedFilesPage;
