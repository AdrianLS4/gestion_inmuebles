import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Propietarios from './pages/Propietarios';
import Inmuebles from './pages/Inmuebles';
import Gastos from './pages/Gastos';
import Recibos from './pages/Recibos';
import Pagos from './pages/Pagos';
import Reportes from './pages/Reportes';
import ConfiguracionRecibos from './pages/ConfiguracionRecibos';
import VerificacionAutomatica from './pages/VerificacionAutomatica';
import { authService } from './services/condominioService';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - token:', localStorage.getItem('token'));
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/propietarios" element={
          <ProtectedRoute>
            <Layout>
              <Propietarios />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/inmuebles" element={
          <ProtectedRoute>
            <Layout>
              <Inmuebles />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/gastos" element={
          <ProtectedRoute>
            <Layout>
              <Gastos />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/recibos" element={
          <ProtectedRoute>
            <Layout>
              <Recibos />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/pagos" element={
          <ProtectedRoute>
            <Layout>
              <Pagos />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reportes" element={
          <ProtectedRoute>
            <Layout>
              <Reportes />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/configuracion-recibos" element={
          <ProtectedRoute>
            <Layout>
              <ConfiguracionRecibos />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/verificacion-automatica" element={
          <ProtectedRoute>
            <Layout>
              <VerificacionAutomatica />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;