import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './pages/DashboardLayout'; // 1. Importe o Layout
import DashboardPage from './pages/DashboardPage';   // 2. Importe a Página
import ProtectedRoute from './components/ProtectedRoute'; // 3. Importe a Rota Protegida
import PlaceholderPage from './pages/PlaceholderPage';

// Importe os estilos do dashboard
import './style/Dashboard.css'; 
// Mantenha os estilos do App.css também
import './style/App.css'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Rotas Públicas --- */}
        <Route path="/" element={<PlaceholderPage title="Início" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/analise" element={<PlaceholderPage title="Análise" />} />
        <Route path="/termos" element={<PlaceholderPage title="Termos" />} />

        <Route path="/painel" element={<DashboardLayout />}>
          {/* A rota "index" é a padrão para /dashboard */}
          <Route index element={<DashboardPage />} /> 
          
          {/* Outras páginas dentro do layout do dashboard */}
          <Route path="comparativos" element={<PlaceholderPage title="Dados Comparativos" />} />
          <Route path="historico" element={<PlaceholderPage title="Histórico de Emissões" />} />
          <Route path="fotografias" element={<PlaceholderPage title="Fotografias da Frota" />} />
        </Route>
        
        {/* --- Rotas Restritas (Dashboard) --- */}
        <Route element={<ProtectedRoute />}>
        </Route>
        
        {/* Rota para qualquer URL não encontrada */}
        <Route path="*" element={<><h1>404 - Página Não Encontrada</h1><Link to="/">Voltar para Home</Link></>} />
      </Routes>
    </Router>
  );
}

export default App;