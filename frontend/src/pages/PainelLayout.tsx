import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';

const PainelLayout = () => {
  useEffect(() => {
    import('../style/Painel.css');
  }, []);

  return (
    <div className="painel-layout">
      <Navbar />
      <main className="painel-content">
        <Header />
        <div className="main-content">
          <Outlet /> {/* Aqui é onde as páginas (Dashboard, Histórico, etc.) serão renderizadas */}
        </div>
      </main>
    </div>
  );
};

export default PainelLayout;