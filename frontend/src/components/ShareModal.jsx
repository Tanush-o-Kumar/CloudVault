import React, { useState, useEffect } from 'react';
import { X, Share2, Mail, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { sharesApi } from '../api/shares';

const ShareModal = ({ isOpen, file, onClose, onShareUpdated }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [sharesList, setSharesList] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && file) {
      loadShares();
      setErrorMsg('');
      setSuccessMsg('');
      setRecipientEmail('');
    }
  }, [isOpen, file]);

  const loadShares = async () => {
    if (!file) return;
    setLoadingShares(true);
    try {
      const data = await sharesApi.getFileShares(file.id);
      setSharesList(data);
    } catch {
      // Ignore if not owner
    } finally {
      setLoadingShares(false);
    }
  };

  if (!isOpen || !file) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sharesApi.shareFile(file.id, recipientEmail.trim(), permission);
      setSuccessMsg(`File shared with ${recipientEmail}!`);
      setRecipientEmail('');
      await loadShares();
      onShareUpdated && onShareUpdated();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Failed to share file.';
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (shareId) => {
    try {
      await sharesApi.revokeShare(file.id, shareId);
      setSuccessMsg('Sharing permission revoked immediately.');
      await loadShares();
      onShareUpdated && onShareUpdated();
    } catch (err) {
      setErrorMsg('Failed to revoke access.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Share File</h3>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">{file.original_filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
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

          {/* Share form */}
          <form onSubmit={handleShare} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Share with registered user
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="read">Can view & download</option>
              </select>

              <button
                type="submit"
                disabled={submitting || !recipientEmail.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Share</span>
              </button>
            </div>
          </form>

          {/* Existing shares list */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              People with access ({sharesList.filter(s => s.is_active).length})
            </h4>

            {loadingShares ? (
              <div className="py-4 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Loading shares...
              </div>
            ) : sharesList.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                This file is not currently shared with anyone.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                {sharesList.map((share) => (
                  <div key={share.id} className="p-3 flex items-center justify-between text-sm hover:bg-slate-50 transition">
                    <div className="overflow-hidden pr-2">
                      <p className="font-medium text-slate-800 text-xs truncate">{share.recipient_name} ({share.recipient_email})</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="capitalize">{share.permission}-only</span>
                        <span>•</span>
                        {share.is_active ? (
                          <span className="text-emerald-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-500 font-medium">Revoked</span>
                        )}
                      </div>
                    </div>

                    {share.is_active && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        title="Revoke access immediately"
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
