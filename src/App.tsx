import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { Login } from './components/Login';
import { LeadMap } from './components/LeadMap';
import { MyLeads } from './components/MyLeads';
import { MyStats } from './components/MyStats';
import { Team } from './components/Team';
import { Territory } from './components/Territory';
import { Import } from './components/Import';
import { FCCLeadLookup } from './components/FCCLeadLookup';
import { Settings } from './components/Settings';
import { ToastContainer } from './components/Toast';
import { SettingsProvider } from './hooks/useSettings';
import { LeadsProvider } from './hooks/useLeads';
import {
  MapPin,
  List,
  BarChart3,
  Users,
  Map,
  Upload,
  Search,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

function AppContent() {
  const { member, isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-pulse text-accent-cyan text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Define navigation based on role
  const navItems: NavItem[] = [
    { id: 'map', label: 'Map', icon: <MapPin className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'leads', label: 'My Leads', icon: <List className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'stats', label: 'My Stats', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'territory', label: 'Territory', icon: <Map className="w-5 h-5" />, roles: ['admin', 'manager'] },
    { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
    { id: 'fcc', label: 'Find Leads', icon: <Search className="w-5 h-5" />, roles: ['admin'] },
    { id: 'import', label: 'Imports', icon: <Upload className="w-5 h-5" />, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(member?.role || '')
  );

  // Limit to 5 tabs on mobile
  const mobileNav = filteredNav.slice(0, 5);

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="h-full w-full">
            <LeadMap statusFilter={statusFilter.size > 0 ? statusFilter : undefined} />
          </div>
        );
      case 'leads':
        return <MyLeads />;
      case 'stats':
        return <MyStats />;
      case 'territory':
        return <Territory />;
      case 'team':
        return <Team />;
      case 'fcc':
        return <FCCLeadLookup />;
      case 'import':
        return <Import />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <LeadsProvider>
      <div className="h-screen flex bg-dark-bg">
        {/* Desktop Sidebar */}
        <aside className="sidebar hidden md:flex flex-col bg-dark-card border-r border-dark-border">
          {/* Logo */}
          <div className="px-4 py-6 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent-cyan" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">YFM</h1>
                <p className="text-xs text-gray-500 capitalize">{member?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                          ${activeTab === item.id
                            ? 'bg-accent-cyan/20 text-accent-cyan'
                            : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                          }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{member?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{member?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden px-4 py-3 bg-dark-card border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent-cyan" />
              <span className="font-bold text-white">YFM</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-white">{member?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{member?.role}</p>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden main-content">
            {renderContent()}
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="bottom-nav md:hidden bg-dark-card border-t border-dark-border px-2 py-2">
            <div className="flex justify-around">
              {mobileNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]
                            ${activeTab === item.id
                              ? 'text-accent-cyan'
                              : 'text-gray-500'
                            }`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}

              {/* More menu for items beyond 5 */}
              {filteredNav.length > 5 && (
                <button
                  onClick={() => {
                    // Show menu modal
                    const nextItem = filteredNav[5];
                    if (nextItem) setActiveTab(nextItem.id);
                  }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]
                            ${!mobileNav.find((n) => n.id === activeTab) ? 'text-accent-cyan' : 'text-gray-500'}`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">More</span>
                </button>
              )}
            </div>
          </nav>
        </main>

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </LeadsProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
