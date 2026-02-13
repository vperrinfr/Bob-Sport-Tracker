import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/ui/Layout';
import { ToastProvider } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { ActivitiesList } from './pages/ActivitiesList';
import { ActivityDetail } from './pages/ActivityDetail';
import { UploadPage } from './pages/UploadPage';
import { StravaSettings } from './pages/StravaSettings';
import { StravaCallback } from './pages/StravaCallback';
import { Statistics } from './pages/Statistics';
import { Records } from './pages/Records';
import { TrainingZones } from './pages/TrainingZones';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/activities" element={<ActivitiesList />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/records" element={<Records />} />
        <Route path="/zones" element={<TrainingZones />} />
        <Route path="/strava/settings" element={<StravaSettings />} />
        <Route path="/strava/callback" element={<StravaCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider />
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

// Made with Bob
