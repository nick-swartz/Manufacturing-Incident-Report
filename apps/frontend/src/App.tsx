import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { IncidentForm } from './components/IncidentForm';
import { ConfirmationPage } from './components/ConfirmationPage';
import { Dashboard } from './components/Dashboard';
import { TrackingPage } from './components/TrackingPage';
import LoginForm from './components/Auth/LoginForm';
import OAuthCallback from './components/Auth/OAuthCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<IncidentForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
