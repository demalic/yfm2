import React, { useState, useCallback, lazy, Suspense, useTransition } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { Login } from './components/Login';
import { SplashScreen } from './components/SplashScreen';
import { LeadMap } from './components/LeadMap';
import { MapSelectionScreen, type MapSubView } from './components/MapSelectionScreen';
import { LeadsSubViewBar, type LeadsSubView } from './components/LeadsHub';
import { TeamSubViewBar, type TeamSubView } from './components/TeamHub';
import { Settings } from './components/Settings';
import { ToastContainer } from './components/Toast';
import { SettingsProvider } from './hooks/useSettings';
import { LeadsProvider } from './hooks/useLeads';
import { YfmLogoMark } from './components/YfmLogo';
import { ViewFallback } from './components/ui/ViewFallback';
import {
  ViewTransitionScreen,
  useMinTransitionOverlay,
  TABLE_LOAD_MIN_MS,
} from './components/ui/ViewTransitionScreen';
import {
  getTransitionLabel,
  type TransitionLabelProps,
} from './components/ui/table-transition-label';
import { usingDevBackend } from './lib/supabase';
import {
  MapPin,
  List,
  Users,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';

const LeadsHub = lazy(() =>
  import('./components/LeadsHub').then((m) => ({ default: m.LeadsHub }))
);
const TeamHub = lazy(() =>
  import('./components/TeamHub').then((m) => ({ default: m.TeamHub }))
);
const MyLeads = lazy(() =>
  import('./components/MyLeads').then((m) => ({ default: m.MyLeads }))
);
const FCCLeadLookup = lazy(() =>
  import('./components/FCCLeadLookup').then((m) => ({ default: m.FCCLeadLookup }))
);
const Import = lazy(() =>
  import('./components/Import').then((m) => ({ default: m.Import }))
);
const EligibilityCheck = lazy(() =>
  import('./components/EligibilityCheck').then((m) => ({ default: m.EligibilityCheck }))
);
const Team = lazy(() =>
  import('./components/Team').then((m) => ({ default: m.Team }))
);
const MyStats = lazy(() =>
  import('./components/MyStats').then((m) => ({ default: m.MyStats }))
);
const Territory = lazy(() =>
  import('./components/Territory').then((m) => ({ default: m.Territory }))
);

function getContentKey(
  activeTab: string,
  leadsSubView: LeadsSubView,
  teamSubView: TeamSubView,
  mapSubView: MapSubView
) {
  if (activeTab === 'map') return `map-${mapSubView}`;
  if (activeTab === 'leads') return `leads-${leadsSubView}`;
  if (activeTab === 'team') return `team-${teamSubView}`;
  return activeTab;
}

function getSuspenseTransition(
  activeTab: string,
  leadsSubView: LeadsSubView,
  teamSubView: TeamSubView
): TransitionLabelProps {
  return getTransitionLabel(getContentKey(activeTab, leadsSubView, teamSubView));
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

function AppContent() {
  const { member, isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [mapSubView, setMapSubView] = useState<MapSubView>('select');
  const [leadsSubView, setLeadsSubView] = useState<LeadsSubView>('hub');
  const [teamSubView, setTeamSubView] = useState<TeamSubView>('hub');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [transitionLabel, setTransitionLabel] = useState<TransitionLabelProps>({
    label: 'Loading',
  });
  const [transitionMinMs, setTransitionMinMs] = useState(TABLE_LOAD_MIN_MS);
  const showTransition = useMinTransitionOverlay(isPending, transitionMinMs);

  const runTransition = useCallback((
    transitionKey: string,
    fn: () => void,
    minMs: number = TABLE_LOAD_MIN_MS
  ) => {
    setTransitionLabel(getTransitionLabel(transitionKey));
    setTransitionMinMs(minMs);
    startTransition(fn);
  }, []);

  const goToLeadsHub = () => {
    runTransition('leads-hub', () => {
      setActiveTab('leads');
      setLeadsSubView('hub');
    });
  };

  const goToTeamHub = () => {
    runTransition('team-hub', () => {
      setActiveTab('team');
      setTeamSubView('hub');
    });
  };

  const handleNavClick = (id: string) => {
    if (id === 'leads') {
      goToLeadsHub();
      return;
    }
    if (id === 'team') {
      goToTeamHub();
      return;
    }
    if (id === 'map') {
      if (activeTab !== 'map') {
        setMapSubView('select');
      }
      setActiveTab('map');
      return;
    }
    runTransition(id, () => setActiveTab(id), 480);
  };

  const handleLeadsNavigate = (view: Exclude<LeadsSubView, 'hub'>) => {
    runTransition(`leads-${view}`, () => {
      setLeadsSubView(view);
    });
  };

  const handleTeamNavigate = (view: Exclude<TeamSubView, 'hub'>) => {
    runTransition(`team-${view}`, () => {
      setTeamSubView(view);
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen app-shell overflow-hidden">
        <ViewTransitionScreen label="Loading YFM" variant="opening" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const navItems: NavItem[] = [
    { id: 'map', label: 'Map', icon: <MapPin className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'leads', label: 'Leads', icon: <List className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, roles: ['admin', 'manager', 'rep'] },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(member?.role || '')
  );

  const suspenseTransition = getSuspenseTransition(activeTab, leadsSubView, teamSubView);

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        if (mapSubView === 'select') {
          return (
            <MapSelectionScreen onContinue={() => setMapSubView('map')} />
          );
        }
        return (
          <LeadMap
            statusFilter={statusFilter.size > 0 ? statusFilter : undefined}
            onStatusFilterChange={setStatusFilter}
          />
        );
      case 'leads':
        if (leadsSubView === 'hub') {
          return (
            <Suspense fallback={<ViewFallback {...suspenseTransition} />}>
              <LeadsHub onNavigate={handleLeadsNavigate} />
            </Suspense>
          );
        }
        return (
          <div className="h-full flex flex-col overflow-hidden">
            <LeadsSubViewBar
              onBack={() =>
                runTransition('leads-hub', () => setLeadsSubView('hub'))
              }
            />
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<ViewFallback {...suspenseTransition} />}>
                {leadsSubView === 'list' && <MyLeads />}
                {leadsSubView === 'find' && <FCCLeadLookup />}
                {leadsSubView === 'import' && <Import />}
                {leadsSubView === 'eligibility' && <EligibilityCheck />}
              </Suspense>
            </div>
          </div>
        );
      case 'team':
        if (teamSubView === 'hub') {
          return (
            <Suspense fallback={<ViewFallback {...suspenseTransition} />}>
              <TeamHub onNavigate={handleTeamNavigate} />
            </Suspense>
          );
        }
        return (
          <div className="h-full flex flex-col overflow-hidden">
            <TeamSubViewBar
              onBack={() =>
                runTransition('team-hub', () => setTeamSubView('hub'))
              }
            />
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<ViewFallback {...suspenseTransition} />}>
                {teamSubView === 'members' && <Team section="members" />}
                {teamSubView === 'commission' && <Team section="commission" />}
                {teamSubView === 'stats' && <MyStats />}
                {teamSubView === 'territory' && <Territory />}
              </Suspense>
            </div>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  const isNavActive = (id: string) => activeTab === id;

  const contentKey = getContentKey(activeTab, leadsSubView, teamSubView, mapSubView);

  return (
    <LeadsProvider>
      <div className="h-screen w-full flex app-shell overflow-hidden fixed inset-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col sidebar-panel w-[260px] shrink-0">
          <div className="px-5 py-5 border-b border-white/[0.06]">
            <div className="flex flex-col gap-2">
              <YfmLogoMark />
              <p className="text-xs text-brand-orange capitalize font-semibold pl-0.5">
                {member?.role}
              </p>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          ${isNavActive(item.id)
                            ? 'nav-active text-brand-orange-bright'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
              >
                {item.icon}
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between glass-card rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{member?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{member?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-gray-400 hover:text-brand-orange" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {usingDevBackend && (
            <div className="shrink-0 px-3 py-1.5 bg-brand-orange/15 border-b border-brand-orange/30 text-center">
              <p className="text-xs text-brand-orange-bright font-semibold">
                Local dev mode — sample data · Login: demalic / yfmusa
              </p>
            </div>
          )}
          <header className="md:hidden h-14 px-4 glass border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <YfmLogoMark className="h-7 shrink-0" />
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-semibold">{member?.name}</p>
              <p className="text-xs text-brand-orange capitalize font-medium">{member?.role}</p>
            </div>
          </header>

          <div className="flex-1 relative overflow-hidden min-h-0">
            {showTransition && (
              <ViewTransitionScreen
                {...transitionLabel}
                className="absolute inset-0 z-30"
                variant="table"
              />
            )}
            <div
              key={contentKey}
              className={`h-full overflow-hidden ${
                showTransition ? 'opacity-0 pointer-events-none' : ''
              } ${contentKey.endsWith('-hub') ? '' : 'tab-content-enter'}`}
            >
              {renderContent()}
            </div>
          </div>

          <nav className="md:hidden glass border-t border-white/[0.06] px-2 py-2 shrink-0">
            <div className="bottom-nav-scroll flex gap-0.5">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all shrink-0 min-w-[52px]
                            ${isNavActive(item.id)
                              ? 'text-brand-orange bg-brand-orange/12'
                              : 'text-gray-500'
                            }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-semibold">{item.label}</span>
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
