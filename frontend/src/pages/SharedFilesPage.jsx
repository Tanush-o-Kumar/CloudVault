import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Share2,
  Download,
  Trash2,
  User,
  Clock,
  Shield,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { formatBytes, formatDate, getFileIcon } from '../components/FileCard';
import { sharesApi } from '../api/shares';
import { filesApi } from '../api/files';

const SharedFilesPage = ({ initialTab = 'received' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on route or prop
  const currentTab = location.pathname.includes('shared-by-me')
    ? 'sent'
    : location.pathname.includes('shared-with-me')
    ? 'received'
    : initialTab;

  const [activeTab, setActiveTab] = useState(currentTab);
  const [receivedShares, setReceivedShares] = useState([]);
  const [sentShares, setSentShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (location.pathname.includes('shared-by-me')) {
      setActiveTab('sent');
    } else if (location.pathname.includes('shared-with-me')) {
      setActiveTab('received');
    }
  }, [location.pathname]);

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
      alert('Unable to download shared file. Sharing permission may have expired or been revoked.');
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
    <AppLayout onUploadSuccess={loadData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === 'received' ? 'Shared with Me' : 'Shared by Me'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeTab === 'received'
                ? 'Files and documents shared with your account by other registered users'
                : 'Manage files you have shared with collaborators and manage access revocation'}
            </p>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-medium animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Controls Bar */}
        <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('received');
              navigate('/shared-with-me');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'received'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Shared with me ({receivedShares.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sent');
              navigate('/shared-by-me');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Share2 className="w-4 h-4 rotate-180" />
            <span>Shared by me ({sentShares.length})</span>
          </button>
        </div>

        {/* Main Shares Content */}
        {loading ? (
          <TableSkeleton rows={5} />
        ) : activeTab === 'received' ? (
          /* Received Shares Table */
          receivedShares.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No incoming shared files</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When another registered user shares documents with your email, they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
              {receivedShares.map((item) => (
                <div
                  key={item.share_id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden pr-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getFileIcon(item.content_type)}
                    </div>
                    <div className="truncate min-w-0">
                      <p
                        className="text-sm font-semibold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                        title={item.original_filename}
                        onClick={() => handleDownload(item.file_id, item.original_filename)}
                      >
                        {item.original_filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{formatBytes(item.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Shared by {item.owner_name} ({item.owner_email})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.shared_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(item.file_id, item.original_filename)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition"
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
          /* Sent Shares Table */
          sentShares.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No active outbound shares</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You have not shared any files with other users yet. Go to My Files to share.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
              {sentShares.map((item) => (
                <div
                  key={item.share_id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition"
                >
                  <div className="overflow-hidden pr-4 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.original_filename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="text-slate-700 font-medium">
                        Recipient: {item.recipient_name} ({item.recipient_email})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(item.shared_at)}
                      </span>
                      <span>•</span>
                      {item.is_active ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                          Active Permission
                        </span>
                      ) : (
                        <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-full text-[11px] border border-red-200">
                          Revoked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.is_active && (
                      <button
                        onClick={() => handleRevoke(item.file_id, item.share_id)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 transition"
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
      </div>
    </AppLayout>
  );
};

export default SharedFilesPage;
