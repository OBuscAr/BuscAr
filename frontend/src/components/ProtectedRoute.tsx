import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Verifique se o token de autenticação existe no localStorage
  const token = localStorage.getItem('authToken');

  if (!token) {
    // Se não houver token, redirecione para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se houver token, renderize o componente filho (no caso, o DashboardLayout)
  return <Outlet />;
};

export default ProtectedRoute;