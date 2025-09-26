import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FloatingAIChatbot from './FloatingAIChatbot';

const MainLayout: React.FC = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <FloatingAIChatbot />
    </div>
  );
};

export default MainLayout;