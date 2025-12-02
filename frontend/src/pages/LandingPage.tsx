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
import { routeComparisonService } from '../services/routeComparisonService';
import type { RouteOption, AirQualityData } from '../services/routeComparisonService';

const LandingPage = () => {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<RouteOption | null>(null);
  const [originAirQuality, setOriginAirQuality] = useState<AirQualityData | null>(null);
  const [destinationAirQuality, setDestinationAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuscar = async () => {
    if (!origem || !destino) {
      alert('Por favor, preencha origem e destino');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await routeComparisonService.compareRoutes(origem, destino);
      
      if (result.routes && result.routes.length > 0) {
        // Pega a primeira rota (melhor opção)
        setSearchResults(result.routes[0]);
        setOriginAirQuality(result.origin_air_quality);
        setDestinationAirQuality(result.destination_air_quality);
        setShowResults(true);
      } else {
        setError('Nenhuma rota encontrada para os endereços informados.');
      }
    } catch (err: any) {
      console.error('Erro ao buscar rota:', err);
      setError(err.response?.data?.detail || 'Erro ao buscar rotas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
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
            <a href="#calcular-rota" className="btn-analise" onClick={(e) => {
              e.preventDefault();
              document.getElementById('calcular-rota')?.scrollIntoView({ behavior: 'smooth' });
            }}>Analise suas rotas aqui</a>
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
      <section id="calcular-rota" className="search-section">
        <div className="search-container">
          <div className="search-box">
            <h2 className="search-title">Calcule sua rota</h2>
            <div className="search-inputs">
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Digite a origem"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                  className="search-input"
                />
              </div>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Digite o destino"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                  className="search-input"
                />
              </div>
              <button className="btn-buscar" onClick={handleBuscar} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <LandingMap encodedPolyline={searchResults?.polyline.encodedPolyline} />

          {/* Resultados abaixo do mapa */}
          {showResults && searchResults && (
            <div className="results-inline">
              <div className="results-header-inline">
                <h3>Resultados da busca:</h3>
              </div>
              
              <div className="results-info">
                <div className="info-row">
                  <span className="info-label">De:</span>
                  <span className="info-value">{origem}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Para:</span>
                  <span className="info-value">{destino}</span>
                </div>
              </div>

              <div className="route-description">
                <p>{searchResults.description}</p>
              </div>

              {/* Qualidade do Ar */}
              {(originAirQuality || destinationAirQuality) && (
                <div className="air-quality-section">
                  <h4>Qualidade do Ar</h4>
                  <div className="air-quality-grid">
                    {originAirQuality && (
                      <div className="air-quality-card origin">
                        <div className="air-quality-header">
                          <span className="location-label">Origem</span>
                        </div>
                        {originAirQuality.indexes.map((index, idx) => (
                          <div key={idx} className="aqi-item">
                            <span className="aqi-label">{index.displayName}</span>
                            <div className="aqi-value-row">
                              <span className="aqi-number">{index.aqi}</span>
                              <span className="aqi-category">{index.category}</span>
                            </div>
                          </div>
                        ))}
                        <div className="health-recommendation">
                          💡 {originAirQuality.health_recommendation}
                        </div>
                      </div>
                    )}
                    {destinationAirQuality && (
                      <div className="air-quality-card destination">
                        <div className="air-quality-header">
                          <span className="location-label">Destino</span>
                        </div>
                        {destinationAirQuality.indexes.map((index, idx) => (
                          <div key={idx} className="aqi-item">
                            <span className="aqi-label">{index.displayName}</span>
                            <div className="aqi-value-row">
                              <span className="aqi-number">{index.aqi}</span>
                              <span className="aqi-category">{index.category}</span>
                            </div>
                          </div>
                        ))}
                        <div className="health-recommendation">
                          💡 {destinationAirQuality.health_recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="route-details">
                <h4>Detalhes da rota:</h4>
                <div className="details-grid">
                  <div className="detail-card">
                    <span className="detail-label">Distância</span>
                    <span className="detail-value">{searchResults.distance_km.toFixed(1)} km</span>
                  </div>
                  <div className="detail-card">
                    <span className="detail-label">Emissão de CO₂</span>
                    <span className="detail-value">{searchResults.emission_kg_co2.toFixed(2)} kg</span>
                  </div>
                  <div className="detail-card">
                    <span className="detail-label">Segmentos</span>
                    <span className="detail-value">{searchResults.segments.length}</span>
                  </div>
                  <div className="detail-card">
                    <span className="detail-label">Tipo</span>
                    <span className="detail-value">
                      {searchResults.segments.some(s => s.type === 'BUS') ? 'Ônibus + Caminhada' : 'Caminhada'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="results-actions">
                <Link 
                  to="/login" 
                  className="btn-details"
                >
                  Faça login para salvar e analisar mais rotas
                </Link>
              </div>
            </div>
          )}
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
