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
  MoreHorizontal,
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
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
    { id: 'leads', label: 'Leads', icon: <List className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'territory', label: 'Territory', icon: <Map className="w-5 h-5" />, roles: ['admin', 'manager'] },
    { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
    { id: 'fcc', label: 'Find', icon: <Search className="w-5 h-5" />, roles: ['admin'] },
    { id: 'import', label: 'Import', icon: <Upload className="w-5 h-5" />, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(member?.role || '')
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <LeadMap
            statusFilter={statusFilter.size > 0 ? statusFilter : undefined}
            onStatusFilterChange={setStatusFilter}
          />
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

  const isNavActive = (id: string) => activeTab === id;

  return (
    <LeadsProvider>
      <div className="h-screen w-full flex bg-dark-bg overflow-hidden fixed inset-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col bg-dark-card border-r border-dark-border w-[240px] shrink-0">
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
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                          ${isNavActive(item.id)
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
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden h-14 px-4 bg-dark-card border-b border-dark-border flex items-center justify-between shrink-0">
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
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden bg-dark-card border-t border-dark-border px-2 py-2 safe-area-pb shrink-0">
            <div className="bottom-nav-scroll flex gap-1">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors shrink-0 min-w-[56px]
                            ${isNavActive(item.id)
                              ? 'text-accent-cyan'
                              : 'text-gray-500'
                            }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              ))}
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
