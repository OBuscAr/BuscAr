import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Verifica token salvo pelo fluxo real (access_token) ou legado (authToken)
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');

  console.log('🔒 ProtectedRoute - Token encontrado:', token ? 'SIM' : 'NÃO');
  console.log('🔒 ProtectedRoute - access_token:', localStorage.getItem('access_token'));
  console.log('🔒 ProtectedRoute - authToken:', localStorage.getItem('authToken'));

  if (!token) {
    // Se não houver token, redirecione para a página de login
    console.log('🔒 ProtectedRoute - Redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  // Se houver token, renderize o componente filho (no caso, o DashboardLayout)
  console.log('🔒 ProtectedRoute - Acesso permitido');
  return <Outlet />;
};

export default ProtectedRoute;