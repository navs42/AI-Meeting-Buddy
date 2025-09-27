import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, TasksIcon, NotesIcon, PlusSquareIcon, ChevronsLeftIcon, ChevronsRightIcon, UsersIcon } from './Icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/notes', label: 'Notes', icon: NotesIcon },
  { to: '/connections', label: 'Connections', icon: UsersIcon },
  { to: '/meeting/new', label: 'New Meeting', icon: PlusSquareIcon },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setMobileOpen, isCollapsed, setCollapsed }) => {
  const baseLinkClasses = "flex items-center px-3 py-3 text-neutral-600 hover:bg-neutral-100 hover:text-primary rounded-lg transition-colors";
  const activeLinkClasses = "bg-primary/10 text-primary font-semibold";

  const handleNavLinkClick = () => {
      if (window.innerWidth < 768) { // md breakpoint
          setMobileOpen(false);
      }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      ></div>
      <aside className={`
        fixed md:relative top-0 left-0 h-full bg-white p-4 flex flex-col border-r border-neutral-200 z-40
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        <div className={`flex items-center mb-8 ${isCollapsed ? 'md:justify-center' : 'md:justify-between'}`}>
            <h1 className={`text-2xl font-bold text-primary px-2 transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>MeetSync</h1>
            <button
                onClick={() => setCollapsed(!isCollapsed)}
                className="hidden md:block p-1 rounded-full text-neutral-500 hover:bg-neutral-200"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronsRightIcon className="w-5 h-5" /> : <ChevronsLeftIcon className="w-5 h-5" />}
            </button>
            <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden text-neutral-500 hover:text-primary p-1"
                aria-label="Close menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <nav className="flex-1">
          <ul>
            {navItems.map(item => (
              <li key={item.to} className="mb-2">
                <NavLink
                  to={item.to}
                  onClick={handleNavLinkClick}
                  className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''} ${isCollapsed ? 'md:justify-center' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;