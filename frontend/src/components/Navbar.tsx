import { NavLink, useNavigate } from 'react-router-dom';
import BuscArLogo from '../assets/bus_leaf_icon.png';
import '../style/Dashboard.css';

// Importando ícones
import { 
  BsGrid1X2Fill, 
  BsBarChartFill, 
  BsClockHistory, 
  BsCameraFill, 
} from 'react-icons/bs';

const Navbar = () => {
  const navigate = useNavigate();

  const handleSair = () => {
    // Limpa o localStorage e redireciona para o login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <aside className="navbar">
      <div className="navbar-logo">
        <img src={BuscArLogo} alt="BuscAr Logo" />
        <h1>Busc<b>Ar</b></h1>
      </div>
      <nav className="navbar-nav">
        <NavLink to="/dashboard/" end className={({ isActive }) => (isActive ? 'active' : '')}>
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
      <div className="navbar-footer">
        <a href="#" onClick={handleSair} style={{ padding: '1rem 0' }}>
          Sair
        </a>
      </div>
    </aside>
  );
};

export default Navbar;