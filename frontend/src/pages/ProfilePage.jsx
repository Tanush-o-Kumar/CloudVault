import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  HardDrive,
  Calendar,
  LogOut,
  Database,
  KeyRound,
  CheckCircle2,
  Server
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { formatBytes, formatDate } from '../components/FileCard';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboard';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile & Settings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Account credentials, storage allocations, and security specifications
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-900 text-lg truncate">{user?.full_name}</h3>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold uppercase">
                    Active Account
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Account ID
                  </span>
                  <span className="font-mono text-xs text-slate-500 truncate max-w-[140px]" title={user?.id}>
                    {user?.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Registered
                  </span>
                  <span className="text-xs text-slate-700 font-medium">
                    {formatDate(user?.created_at || new Date().toISOString())}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium py-2.5 px-4 rounded-xl text-sm transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Vault</span>
              </button>
            </div>

            {/* Storage & Cloud Security Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Storage Quota Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  Cloud Storage Allocation
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Used: {formatBytes(stats?.total_storage_bytes || 0)}</span>
                    <span>Total Quota: {formatBytes(stats?.storage_limit_bytes || (500 * 1024 * 1024))}</span>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats?.storage_percentage || 0, 100)}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Objects are stored with unique UUID-hashed storage keys in an encrypted private Amazon S3 bucket.
                  </p>
                </div>
              </div>

              {/* Security Specs Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Implemented Cloud Security Controls
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
                    <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">Argon2id Hashing</p>
                      <p className="text-slate-500 mt-0.5">Password hashes are computed with memory-hard Argon2id parameters.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
                    <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">PostgreSQL Normalization</p>
                      <p className="text-slate-500 mt-0.5">Relational foreign keys and cascade delete rules manage integrity.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
                    <Server className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">AWS S3 Server-Side Encryption</p>
                      <p className="text-slate-500 mt-0.5">All files are encrypted at rest with AES-256 before disk write.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">IDOR Access Verification</p>
                      <p className="text-slate-500 mt-0.5">Every file download and deletion requires server-side ownership checks.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
