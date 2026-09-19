import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './pages/AppShell';
import Login from './pages/Login';
import Home from './pages/Home';
import KnowMyNormal from './pages/KnowMyNormal';
import LogChange from './pages/LogChange';
import Journal from './pages/Journal';
import BodyMap from './pages/BodyMap';
import Screening from './pages/Screening';
import DoctorPrep from './pages/DoctorPrep';
import Summary from './pages/Summary';
import Vault from './pages/Vault';
import Education from './pages/Education';
import Settings from './pages/Settings';
import More from './pages/More';
import Privacy from './pages/Privacy';
import VisitReadiness from './pages/VisitReadiness';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="know-my-normal" element={<KnowMyNormal />} />
            <Route path="log-change" element={<LogChange />} />
            <Route path="journal" element={<Journal />} />
            <Route path="body-map" element={<BodyMap />} />
            <Route path="screening" element={<Screening />} />
            <Route path="doctor-prep" element={<DoctorPrep />} />
            <Route path="visit-readiness" element={<VisitReadiness />} />
            <Route path="summary" element={<Summary />} />
            <Route path="vault" element={<Vault />} />
            <Route path="education" element={<Education />} />
            <Route path="education/:slug" element={<Education />} />
            <Route path="settings" element={<Settings />} />
            <Route path="more" element={<More />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
