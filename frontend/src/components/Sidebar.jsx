import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Share2,
  Clock,
  Star,
  Trash2,
  User,
  Settings,
  HelpCircle,
  LogOut,
  UploadCloud,
  Database,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HardDrive
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

const Sidebar = ({ onUploadClick, collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Files', path: '/files', icon: FolderOpen },
    { name: 'Shared with Me', path: '/shared-with-me', icon: Share2, count: stats?.shares_received_count },
    { name: 'Shared by Me', path: '/shared-by-me', icon: Share2, count: stats?.shares_sent_count },
    { name: 'Recent Files', path: '/recent', icon: Clock },
    { name: 'Starred', path: '/starred', icon: Star },
    { name: 'Trash', path: '/trash', icon: Trash2 },
  ];

  const secondaryNavItems = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help & Support', path: '/help', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between select-none ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900">
                    Cloud<span className="text-blue-600">Vault</span>
                  </span>
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    S3
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-none truncate">Enterprise Cloud Storage</p>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Primary Action Button */}
          {onUploadClick && (
            <div>
              <button
                onClick={onUploadClick}
                className={`w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium rounded-xl shadow-xs hover:shadow-md transition duration-150 ${
                  collapsed ? 'p-3' : 'py-2.5 px-4'
                }`}
                title="Upload File"
              >
                <UploadCloud className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm font-semibold">Upload File</span>}
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Storage
              </div>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group relative ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition group-hover:scale-105" />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {!collapsed && item.count !== undefined && item.count > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Preferences & Support */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Account & Help
              </div>
            )}
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition group-hover:scale-105" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer: Storage Quota & User Profile */}
        <div className="p-3 border-t border-slate-100 space-y-3">
          {/* Storage Quota Card */}
          {!collapsed ? (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Storage Usage
                </span>
                <span className="text-blue-600">{stats?.storage_percentage || 0}%</span>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats?.storage_percentage || 0, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>{formatBytes(stats?.total_storage_bytes || 0)} used</span>
                <span>{formatBytes(stats?.storage_limit_bytes || 500 * 1024 * 1024)}</span>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer"
              title={`Storage: ${stats?.storage_percentage || 0}% used`}
              onClick={() => navigate('/profile')}
            >
              <HardDrive className="w-4 h-4 text-blue-600 mb-1" />
              <span className="text-[10px] font-bold text-slate-700">{stats?.storage_percentage || 0}%</span>
            </div>
          )}

          {/* Quick Sign Out */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/80 p-2 rounded-xl transition ${
              collapsed ? 'justify-center' : 'px-3'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
