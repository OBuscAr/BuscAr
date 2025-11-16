import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import PainelLayout from './pages/PainelLayout';
import DashboardPage from './pages/DashboardPage';

import PlaceholderPage from './pages/PlaceholderPage';

import './style/App.css'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Rotas Públicas --- */}
        <Route path="/"         element={<PlaceholderPage title="Início" />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/analise"  element={<PlaceholderPage title="Análise" />} />
        <Route path="/termos"   element={<PlaceholderPage title="Termos"  />} />

        <Route path="/painel"   element={<PainelLayout />}>
          <Route index               element={<DashboardPage />} /> 
          <Route path="comparativos" element={<PlaceholderPage title="Dados Comparativos" />} />
          <Route path="historico"    element={<PlaceholderPage title="Histórico de Emissões" />} />
          <Route path="fotografias"  element={<PlaceholderPage title="Fotografias da Frota" />} />
        </Route>
        
        {/* --- Rotas Restritas (Painel) --- */}
        <Route element={<ProtectedRoute />}>
        </Route>
        
        {/* Rota para qualquer URL não encontrada */}
        <Route path="*" element={<><h1>404 - Página Não Encontrada</h1><Link to="/">Voltar para Home</Link></>} />
      </Routes>
    </Router>
  );
}

export default App;