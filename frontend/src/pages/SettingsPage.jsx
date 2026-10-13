import React, { useState } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  HardDrive,
  User,
  Sliders,
  CheckCircle2,
  Lock,
  Database
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const [defaultView, setDefaultView] = useState(() => {
    return localStorage.getItem('cloudvault_default_view') || 'grid';
  });
  const [savedMsg, setSavedMsg] = useState('');

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('cloudvault_default_view', defaultView);
    setSavedMsg('Preferences updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account & Cloud Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure vault preferences, review session parameters, and inspect security protocols
          </p>
        </div>

        {savedMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-medium animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedMsg}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* User Account Details */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>User Profile Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Full Name</span>
                <span className="font-semibold text-slate-800 text-sm">{user?.full_name}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800 text-sm">{user?.email}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-1">Account UUID</span>
                <span className="font-mono text-xs text-slate-600">{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Interface Preferences */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Workspace Preferences</span>
            </h3>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default File View Mode
                </label>
                <select
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="grid">Grid Card View</option>
                  <option value="list">Detailed Table View</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
              >
                Save Preferences
              </button>
            </form>
          </div>

          {/* Active Cloud Security Configuration */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Active Cloud Security & Cryptography</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Argon2id Hashing</span>
                </div>
                <p className="text-slate-500">RFC 9106 memory-hard hash configuration (64MB memory, 2 iterations).</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>JWT Token Lifespan</span>
                </div>
                <p className="text-slate-500">Short-lived cryptographic tokens expiring after 60 minutes.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <HardDrive className="w-4 h-4 text-amber-600" />
                  <span>S3 Encryption at Rest</span>
                </div>
                <p className="text-slate-500">Server-Side Encryption with AES-256 (SSE-S3) enabled on all bucket writes.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>S3 Block Public Access</span>
                </div>
                <p className="text-slate-500">Strictly enabled across all ACL and bucket policy boundaries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
