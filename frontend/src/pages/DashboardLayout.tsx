import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import '../Dashboard.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="main-content">
        <Header />
        <div className="dashboard-content">
          <Outlet /> {/* Aqui é onde as páginas (Dashboard, Histórico, etc.) serão renderizadas */}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 