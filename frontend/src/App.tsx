import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PainelLayout = lazy(() => import('./pages/PainelLayout'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ComparativosPage = lazy(() => import('./pages/ComparativosPage'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const EmissionHistoryPage = lazy(() => import('./pages/EmissionHistoryPage'));
const FleetPhotosPage = lazy(() => import('./pages/FleetPhotosPage'));

import './style/App.css'; 

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* --- Rotas Públicas --- */}
          <Route path="/"         element={<PlaceholderPage title="Início" />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/analise"  element={<PlaceholderPage title="Análise" />} />
          <Route path="/termos"   element={<PlaceholderPage title="Termos"  />} />


          
          {/* --- Rotas Restritas (Painel) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/painel"   element={<PainelLayout />}>
              <Route index               element={<DashboardPage />} /> 
              <Route path="comparativos" element={<ComparativosPage />} />
              <Route path="historico"    element={<EmissionHistoryPage />} />
              <Route path="fotografias"  element={<FleetPhotosPage />} />
            </Route>
          </Route>
          
          {/* Rota para qualquer URL não encontrada */}
          <Route path="*" element={<><h1>404 - Página Não Encontrada</h1><Link to="/">Voltar para Home</Link></>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;