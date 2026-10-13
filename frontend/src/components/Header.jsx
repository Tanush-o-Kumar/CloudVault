import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  User as UserIcon,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  FileText,
  Share2,
  CheckCircle2,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboard';
import { formatDate } from './FileCard';

const Header = ({ onToggleMobile, onSearch, searchQuery = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real activities for notifications from actual dashboard endpoint
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const data = await dashboardApi.getStats();
        const recent = (data.recent_files || []).map((f) => ({
          id: f.id,
          title: `Uploaded ${f.original_filename}`,
          time: f.created_at,
          type: 'upload',
        }));
        setActivities(recent);
      } catch {
        // Fallback gracefully
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    } else {
      navigate(`/files?q=${encodeURIComponent(localSearch)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search files, documents, and media..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                if (onSearch) onSearch('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right Controls: Notifications & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Functional Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Recent Activity & Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {activities.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 text-sm">Activity & Notifications</h4>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No recent activities recorded yet.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="py-2.5 px-1 flex items-start gap-3 hover:bg-slate-50 rounded-lg transition">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(act.time)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  to="/files"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View all files in vault →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition group select-none"
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {userInitial}
            </div>
            <div className="hidden sm:block text-left max-w-[120px] md:max-w-[160px] truncate">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {user?.full_name || 'Account'}
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                {user?.email || 'Cloud User'}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Header Summary */}
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                  <Shield className="w-3 h-3" />
                  Authenticated Session
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  to="/help"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help & Cloud Security Specs</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50/80 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
