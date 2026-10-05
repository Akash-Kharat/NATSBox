import React from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import Snackbar from './components/layout/Snackbar';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { useLoadTestStore } from './stores/loadTestStore';

// Real components
import { ConnectionList } from './components/connection/ConnectionList';
import { ConnectionForm } from './components/connection/ConnectionForm';
import { ConnectionDashboard } from './components/connection/ConnectionDashboard';
import { LoadTestList } from './components/loadtest/LoadTestList';
import { LoadTestForm } from './components/loadtest/LoadTestForm';
import { LoadTestDashboard } from './components/loadtest/LoadTestDashboard';
import { ServerManager } from './components/server/ServerManager';
import { ServerMonitorDashboard } from './components/server/ServerMonitorDashboard';
import { Settings } from './components/settings/Settings';
import { About } from './components/about/About';

const LoadTestListWrapper = () => {
  const navigate = useNavigate();
  return (
    <LoadTestList
      onCreateNew={() => navigate('/loadtest/new')}
      onEdit={(cfg) => navigate(`/loadtest/${cfg.id}/edit`)}
      onRun={(cfg) => navigate(`/loadtest/${cfg.id}`)}
    />
  );
};

const LoadTestFormWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const store = useLoadTestStore();
  const config = id ? store.configs.find((c: any) => c.id === id) : null;
  return (
    <LoadTestForm
      initialConfig={config}
      onSave={() => navigate('/loadtest')}
      onCancel={() => navigate('/loadtest')}
    />
  );
};

const LoadTestDashboardWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const store = useLoadTestStore();
  const config = store.configs.find((c: any) => c.id === id);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h3>Load test not found</h3>
        <button onClick={() => navigate('/loadtest')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-medium">Back to Load Tests</button>
      </div>
    );
  }

  return (
    <LoadTestDashboard
      config={config}
      onBack={() => navigate('/loadtest')}
    />
  );
};

export default function App() {
  useConnectionStatus();
  const location = useLocation();

  // Hide the global TopBar on full-page workspace routes
  const hideGlobalHeader = 
    (location.pathname.startsWith('/connection/') && location.pathname !== '/connection/new') ||
    (location.pathname.startsWith('/loadtest/') && location.pathname !== '/loadtest/new');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {!hideGlobalHeader && <AppHeader />}

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 custom-scrollbar relative">
          <Routes>
            <Route path="/" element={<ConnectionList />}>
               <Route path="connection/new" element={<ConnectionForm />} />
               <Route path="connection/:id/edit" element={<ConnectionForm />} />
            </Route>
            <Route path="/connection/:id" element={<ConnectionDashboard />} />
            
            <Route path="/loadtest" element={<LoadTestListWrapper />} />
            <Route path="/loadtest/new" element={<LoadTestFormWrapper />} />
            <Route path="/loadtest/:id/edit" element={<LoadTestFormWrapper />} />
            <Route path="/loadtest/:id" element={<LoadTestDashboardWrapper />} />
            
            <Route path="/server" element={<ServerManager />} />
            <Route path="/server/:id/monitor" element={<ServerMonitorDashboard />} />
            
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>

      <Snackbar />
    </div>
  );
}
