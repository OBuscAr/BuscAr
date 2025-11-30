import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/LandingPage.css';
import busIcon from '../assets/bus_leaf_icon.png';
import turismoSP from '../assets/turismo-estado-sao-paulo.jpg';
import busIllustration from '../assets/Captura de tela 2025-10-17 194929.png';
import iconAnalise from '../assets/Captura de tela 2025-10-17 195135.png';
import iconEconomia from '../assets/Captura de tela 2025-10-17 195240.png';
import iconGraficos from '../assets/Captura de tela 2025-10-17 195316.png';
import LandingMap from '../components/LandingMap';

const LandingPage = () => {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');

  const handleBuscar = () => {
    // Função para buscar rotas
    console.log('Buscando rota de', origem, 'para', destino);
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src={busIcon} alt="BuscAr" className="logo-icon" />
            <span className="logo-text">
              <span style={{ color: '#1f2937' }}>Busc</span>
              <span style={{ color: '#10b981' }}>Ar</span>
            </span>
          </Link>
          <nav className="nav-links">
            <Link to="/">Início</Link>
            <Link to="/login">Fazer login</Link>
            <Link to="/cadastro" className="btn-cadastro">Cadastre-se</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Analise as rotas de ônibus de São Paulo e descubra o impacto ambiental do transporte público.</h1>
            <button className="btn-analise">Analise suas rotas aqui</button>
            <div className="features">
              <div className="feature-item">
                <img src={iconAnalise} alt="Analise rotas" className="feature-icon" />
                <span>Analise rotas</span>
              </div>
              <div className="feature-item">
                <img src={iconEconomia} alt="Economia de CO₂" className="feature-icon" />
                <span>Economia de CO₂</span>
              </div>
              <div className="feature-item">
                <img src={iconGraficos} alt="Gráficos" className="feature-icon" />
                <span>Gráficos</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src={turismoSP}
              alt="São Paulo" 
              className="city-image"
            />
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-box">
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Digite a origem"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Digite o destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn-buscar" onClick={handleBuscar}>
              Buscar
            </button>
          </div>
          <LandingMap />
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="why-section">
        <h2>Por que importa?</h2>
        <div className="why-content">
          <div className="why-text">
            <div className="why-item">
              <h3>Redução de emissão de carbono poluentes</h3>
              <p>
                Permite uma análise sobre quantos poluentes são emitidos ao utilizar um ônibus 
                de uma linha específica, permitindo ao usuário tentar escolher um ônibus menos 
                poluente, afetando na redução de poluição.
              </p>
            </div>
            <div className="why-item">
              <h3>Transparência e engajamento público</h3>
              <p>
                Proporciona aos usuários informações detalhadas sobre as emissões de carbono 
                de cada rota e linha, promovendo maior conscientização sobre o impacto 
                ambiental do transporte público.
              </p>
            </div>
            <div className="why-item">
              <h3>Escolha informada</h3>
              <p>
                Permite que usuários comparem rotas similares e escolham aquelas que minimizam 
                sua pegada ambiental, incentivando decisões de viagem mais sustentáveis.
              </p>
            </div>
          </div>
          <div className="why-illustration">
            <img 
              src={busIllustration}
              alt="Ônibus verde ilustração"
              className="illustration-image"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <img src={busIcon} alt="BuscAr" className="footer-icon" />
              <span className="footer-logo-text">
                <span style={{ color: '#1f2937' }}>Busc</span>
                <span style={{ color: '#10b981' }}>Ar</span>
              </span>
            </div>
            <p className="footer-description">Veja o trânsito com novos olhos, e novos ares.</p>
          </div>
          <div className="footer-right">
            <Link to="/login" className="footer-link">Venha BuscAr!</Link>
            <Link to="/cadastro" className="footer-btn-register">Registrar</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 BuscAr. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
