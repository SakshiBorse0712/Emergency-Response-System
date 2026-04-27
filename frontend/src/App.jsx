import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Pages for now
import Login from './pages/Login';
import Register from './pages/Register';
import PatientApp from './pages/PatientApp';
import HospitalPortal from './pages/HospitalPortal';
import AmbulanceDriverApp from './pages/AmbulanceDriverApp';
import AdminDashboard from './pages/AdminDashboard';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'patient': return <Navigate to="/patient" />;
    case 'hospital': return <Navigate to="/hospital" />;
    case 'ambulance': return <Navigate to="/ambulance" />;
    case 'admin': return <Navigate to="/admin" />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Protected Routes based on roles */}
            <Route path="/patient" element={
              <ProtectedRoute roles={['patient', 'admin']}>
                <PatientApp />
              </ProtectedRoute>
            } />
            <Route path="/hospital" element={
              <ProtectedRoute roles={['hospital', 'admin']}>
                <HospitalPortal />
              </ProtectedRoute>
            } />
            <Route path="/ambulance" element={
              <ProtectedRoute roles={['ambulance', 'admin']}>
                <AmbulanceDriverApp />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
