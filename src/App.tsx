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
      <div className="h-dvh app-shell overflow-hidden">
        <ViewTransitionScreen label="Loading YFM" variant="opening" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const navItems: NavItem[] = [
    { id: 'map', label: 'Map', icon: <MapPin />, roles: ['admin', 'manager', 'rep'] },
    { id: 'leads', label: 'Leads', icon: <List />, roles: ['admin', 'manager', 'rep'] },
    { id: 'team', label: 'Team', icon: <Users />, roles: ['admin', 'manager', 'rep'] },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon />, roles: ['admin'] },
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
      <div className="h-dvh w-full flex flex-col app-shell yfm-shell crm-shell overflow-hidden">
        <header className="crm-app-bar shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <YfmLogoMark className="h-8 shrink-0" />
            <span className="hidden sm:inline text-sm font-semibold text-content-muted">YFM Digital</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-content leading-tight">{member?.name}</p>
              <p className="text-xs text-brand-orange capitalize">{member?.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="crm-app-bar-btn"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <aside className="crm-icon-rail hidden md:flex shrink-0">
            <nav className="flex flex-col items-center gap-2 w-full px-2 py-4">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`crm-rail-btn ${isNavActive(item.id) ? 'crm-rail-btn-active' : ''}`}
                >
                  {item.icon}
                </button>
              ))}
            </nav>
          </aside>

          <main className="crm-main flex-1 flex flex-col min-w-0 min-h-0">
          {usingDevBackend && (
            <div className="shrink-0 px-3 py-1.5 bg-brand-orange/15 border-b border-brand-orange/30 text-center">
              <p className="text-xs text-brand-orange-bright font-semibold">
                Local dev mode — sample data · Login: demalic / yfmusa
              </p>
            </div>
          )}

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

          <nav className="md:hidden bg-surface-raised border-t border-surface-border px-2 py-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="bottom-nav-scroll flex gap-1 justify-around">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all shrink-0 min-w-[56px]
                            ${isNavActive(item.id)
                              ? 'text-brand-orange bg-brand-orange/12'
                              : 'text-gray-500'
                            }`}
                >
                  <span className="crm-mobile-nav-icon">{item.icon}</span>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </main>
        </div>
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
