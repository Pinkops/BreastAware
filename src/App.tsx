import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const AppShell = lazy(() => import('./pages/AppShell'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const KnowMyNormal = lazy(() => import('./pages/KnowMyNormal'));
const LogChange = lazy(() => import('./pages/LogChange'));
const Journal = lazy(() => import('./pages/Journal'));
const BodyMap = lazy(() => import('./pages/BodyMap'));
const Screening = lazy(() => import('./pages/Screening'));
const DoctorPrep = lazy(() => import('./pages/DoctorPrep'));
const Summary = lazy(() => import('./pages/Summary'));
const Vault = lazy(() => import('./pages/Vault'));
const Education = lazy(() => import('./pages/Education'));
const Settings = lazy(() => import('./pages/Settings'));
const More = lazy(() => import('./pages/More'));
const Privacy = lazy(() => import('./pages/Privacy'));
const VisitReadiness = lazy(() => import('./pages/VisitReadiness'));
const FreeKit = lazy(() => import('./pages/FreeKit'));
const Starter = lazy(() => import('./pages/Starter'));
const Redeem = lazy(() => import('./pages/Redeem'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner label="Loading…" />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/free-kit" element={<FreeKit />} />
            <Route path="/starter" element={<Starter />} />
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
              <Route path="redeem" element={<Redeem />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
