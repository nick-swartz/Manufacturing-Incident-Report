import { Routes, Route } from 'react-router-dom';
import { IncidentForm } from './components/IncidentForm';
import { ConfirmationPage } from './components/ConfirmationPage';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<IncidentForm />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
