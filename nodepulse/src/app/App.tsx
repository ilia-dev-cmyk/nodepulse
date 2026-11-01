import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { OverviewPage } from '../pages/OverviewPage';
import { MonitorsPage } from '../pages/MonitorsPage';
import { IncidentsPage } from '../pages/IncidentsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="monitors" element={<MonitorsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
