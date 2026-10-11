import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Share2,
  User,
  LogOut,
  HardDrive,
  UploadCloud,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboard';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const Sidebar = ({ onUploadClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch {
        // Fallback gracefully
      }
    };
    fetchStorage();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Files', path: '/files', icon: FolderOpen },
    { name: 'Shared Files', path: '/shared', icon: Share2 },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 shrink-0">
      <div className="p-4 space-y-6">
        {/* Upload Button */}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-xs transition duration-150"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload File</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Storage Quota & User Footnote */}
      <div className="p-4 border-t border-slate-200 space-y-4">
        {/* Storage Widget */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              Storage Used
            </span>
            <span>{stats?.storage_percentage || 0}%</span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats?.storage_percentage || 0, 100)}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-500 mt-2">
            {formatBytes(stats?.total_storage_bytes || 0)} of {formatBytes(stats?.storage_limit_bytes || (500 * 1024 * 1024))}
          </p>
        </div>

        {/* User logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg border border-slate-200 hover:border-red-200 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
