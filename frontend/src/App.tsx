import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
//import LandingPage from './pages/LandingPage';
import DashboardLayout from './pages/DashboardLayout'; // 1. Importe o Layout
import DashboardPage from './pages/DashboardPage';   // 2. Importe a Página
import ProtectedRoute from './components/ProtectedRoute'; // 3. Importe a Rota Protegida

// Importe os estilos do dashboard
import './style/Dashboard.css'; 
// Mantenha os estilos do App.css também
import './style/App.css'; 

// --- Componentes Placeholder (Provisórios) ---
// (Você pode movê-los para seus próprios arquivos em /pages)
const ComparativosPage = () => <div style={{padding: '2rem'}}><h1>Dados Comparativos</h1><p>Em construção...</p></div>;
const HistoricoPage = () => <div style={{padding: '2rem'}}><h1>Histórico de Emissões</h1><p>Em construção...</p></div>;
const FotografiasPage = () => <div style={{padding: '2rem'}}><h1>Fotografias da Frota</h1><p>Em construção...</p></div>;
const AnalisePage = () => <div style={{padding: '2rem'}}><h1>Página de Análise Interativa</h1><p>Em construção...</p><Link to="/">Voltar</Link></div>;
const TermsPage = () => <div style={{padding: '2rem'}}><h1>Termos e Condições</h1><p>Em construção...</p><Link to="/cadastro">Voltar</Link></div>;
// ---------------------------------------------

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Rotas Públicas --- */}
        {/* <Route path="/" element={<LandingPage />} /> */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/analise" element={<AnalisePage />} />
        <Route path="/termos" element={<TermsPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* A rota "index" é a padrão para /dashboard */}
          <Route index element={<DashboardPage />} /> 
          
          {/* Outras páginas dentro do layout do dashboard */}
          <Route path="comparativos" element={<ComparativosPage />} />
          <Route path="historico" element={<HistoricoPage />} />
          <Route path="fotografias" element={<FotografiasPage />} />
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