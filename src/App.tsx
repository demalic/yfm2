import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { Login } from './components/Login';
import { SplashScreen } from './components/SplashScreen';
import { LeadMap } from './components/LeadMap';
import { MyLeads } from './components/MyLeads';
import { MyStats } from './components/MyStats';
import { Team } from './components/Team';
import { Territory } from './components/Territory';
import { Import } from './components/Import';
import { FCCLeadLookup } from './components/FCCLeadLookup';
import { EligibilityCheck } from './components/EligibilityCheck';
import { Settings } from './components/Settings';
import { ToastContainer } from './components/Toast';
import { SettingsProvider } from './hooks/useSettings';
import { LeadsProvider } from './hooks/useLeads';
import yfmLogo from './assets/yfm-logo.jpg';
import {
  MapPin,
  List,
  BarChart3,
  Users,
  Map,
  Upload,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
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
      <div className="h-screen app-shell flex flex-col items-center justify-center gap-4">
        <div className="loading-ring" />
        <p className="text-gray-500 text-sm">Loading YFM…</p>
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
    { id: 'eligibility', label: 'Eligibility', icon: <ShieldCheck className="w-5 h-5" />, roles: ['admin'] },
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
      case 'eligibility':
        return <EligibilityCheck />;
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
      <div className="h-screen w-full flex app-shell overflow-hidden fixed inset-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col sidebar-panel w-[260px] shrink-0">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img
                src={yfmLogo}
                alt="YFM"
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10"
              />
              <div>
                <h1 className="font-bold text-white text-lg tracking-tight">YFM</h1>
                <p className="text-xs text-accent-cyan/80 capitalize font-medium">{member?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          ${isNavActive(item.id)
                            ? 'nav-active text-accent-cyan'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center justify-between glass-card rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{member?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{member?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden h-14 px-4 glass border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <img src={yfmLogo} alt="YFM" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-white tracking-tight">YFM</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-medium">{member?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{member?.role}</p>
            </div>
          </header>

          {/* Content Area */}
          <div key={activeTab} className="flex-1 overflow-hidden tab-content-enter">
            {renderContent()}
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden glass border-t border-white/5 px-2 py-2 safe-area-pb shrink-0">
            <div className="bottom-nav-scroll flex gap-0.5">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all shrink-0 min-w-[52px]
                            ${isNavActive(item.id)
                              ? 'text-accent-cyan bg-accent-cyan/10'
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
      </div>
    </LeadsProvider>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider>
          {!splashDone && <SplashScreen onDone={handleSplashDone} />}
          <AppContent />
          <ToastContainer />
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
