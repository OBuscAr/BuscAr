import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import BuscArLogo from '../assets/bus_leaf_icon.png';
import '../Dashboard.css';

// Importando ícones
import { 
  BsGrid1X2Fill, 
  BsBarChartFill, 
  BsClockHistory, 
  BsCameraFill, 
  BsBoxArrowRight 
} from 'react-icons/bs';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleSair = () => {
    // Limpa o localStorage e redireciona para o login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={BuscArLogo} alt="BuscAr Logo" />
        <h1>BuscAr</h1>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BsGrid1X2Fill /> Dashboard
        </NavLink>
        <NavLink to="/dashboard/comparativos" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BsBarChartFill /> Dados comparativos
        </NavLink>
        <NavLink to="/dashboard/historico" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BsClockHistory /> Histórico de emissões
        </NavLink>
        <NavLink to="/dashboard/fotografias" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BsCameraFill /> Fotografias da frota
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <a href="#" onClick={handleSair} style={{ padding: '1rem 0' }}>
          <BsBoxArrowRight /> Sair
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;