import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import UploadModal from './UploadModal';

const AppLayout = ({ children, onUploadSuccess, searchQuery, onSearch }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Redesigned Sidebar */}
      <Sidebar
        onUploadClick={() => setIsUploadOpen(true)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Body Wrapper offset by Sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Redesigned Top Header */}
        <Header
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          searchQuery={searchQuery}
          onSearch={onSearch}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsUploadOpen(false);
          if (onUploadSuccess) onUploadSuccess();
        }}
      />
    </div>
  );
};

export default AppLayout;
