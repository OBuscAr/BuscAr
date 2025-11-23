import React, { useState } from 'react';
import '../style/FleetPhotosPage.css';
import { FiSearch, FiMapPin, FiTrendingUp, FiCalendar, FiSave, FiDownload } from 'react-icons/fi';
import RouteMap from '../components/RouteMap';


interface PhotoData {
  id: string;
  linha: string;
  velocidadeMedia: number;
  emissaoCarbono: number;
  iqar: number;
  data: string;
}

interface SavedPhoto {
  id: string;
  linha: string;
  velocidade: string;
  data: string;
  thumbnail: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  value?: number;
}

function FleetPhotosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState<'velocidade' | 'emissao' | 'iqar'>('velocidade');
  const itemsPerPage = 6;

  // Dados mockados - expandido
  const photoData: PhotoData = {
    id: '8084',
    linha: '8084',
    velocidadeMedia: 45,
    emissaoCarbono: 120,
    iqar: 85,
    data: '10 de Outubro, 2025'
  };

  // Pontos de rota de exemplo (São Paulo - ajuste conforme necessário)
  const routePoints: RoutePoint[] = [
    { lat: -23.5505, lng: -46.6333, name: 'Terminal Pinheiros', value: 40 },
    { lat: -23.5489, lng: -46.6388, name: 'Av. Rebouças', value: 45 },
    { lat: -23.5470, lng: -46.6450, name: 'Av. Paulista', value: 35 },
    { lat: -23.5440, lng: -46.6520, name: 'Consolação', value: 38 },
    { lat: -23.5400, lng: -46.6580, name: 'Centro', value: 42 },
    { lat: -23.5350, lng: -46.6620, name: 'República', value: 40 },
    { lat: -23.5320, lng: -46.6680, name: 'Terminal Barra Funda', value: 44 }
  ];

  const savedPhotos: SavedPhoto[] = [
    { id: '8084', linha: '8084', velocidade: '40km/h', data: '10/10/2025', thumbnail: 'https://via.placeholder.com/100x80/4CAF50/FFFFFF?text=8084' },
    { id: '7500', linha: '7500', velocidade: '38km/h', data: '09/10/2025', thumbnail: 'https://via.placeholder.com/100x80/2196F3/FFFFFF?text=7500' },
    { id: '6300', linha: '6300', velocidade: '42km/h', data: '08/10/2025', thumbnail: 'https://via.placeholder.com/100x80/FF9800/FFFFFF?text=6300' },
    { id: '5100', linha: '5100', velocidade: '36km/h', data: '07/10/2025', thumbnail: 'https://via.placeholder.com/100x80/9C27B0/FFFFFF?text=5100' },
    { id: '4200', linha: '4200', velocidade: '44km/h', data: '06/10/2025', thumbnail: 'https://via.placeholder.com/100x80/F44336/FFFFFF?text=4200' },
    { id: '3900', linha: '3900', velocidade: '39km/h', data: '05/10/2025', thumbnail: 'https://via.placeholder.com/100x80/00BCD4/FFFFFF?text=3900' },
  ];

  const totalPages = Math.ceil(savedPhotos.length / itemsPerPage);
  const paginatedPhotos = savedPhotos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSelectedLine(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSavePhoto = () => {
    alert('Fotografia de frota salva com sucesso! 📸');
  };

  const handleExportData = () => {
    alert('Exportando dados da frota... 📊');
  };

  return (
    <div className="fleet-photos-container">
      <div className="photos-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Fotografias de Frota</h1>
            <p>Visualize e analise dados de qualidade do ar das frotas de transporte</p>
          </div>
          <button className="export-btn" onClick={handleExportData}>
            <FiDownload /> Exportar Dados
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Digite o número da frota (ex: 8084)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
        </div>
        <div className="search-buttons">
          <button className="search-btn primary" onClick={handleSearch}>
            <FiSearch /> Buscar Frota
          </button>
          <button className="search-btn secondary" onClick={handleSavePhoto}>
            <FiSave /> Salvar Fotografia
          </button>
        </div>
      </div>

      {selectedLine && (
        <div className="results-container">
          <div className="results-header">
            <h2>
              <FiMapPin className="header-icon" />
              Resultados para a linha "{selectedLine}"
            </h2>
            <div className="results-meta">
              <span className="meta-item">
                <FiCalendar /> {photoData.data}
              </span>
              <span className="meta-item">
                <FiTrendingUp /> Velocidade média: {photoData.velocidadeMedia}km/h
              </span>
            </div>
          </div>

          <div className="content-layout">
            {/* Coluna esquerda - Mapa e Timeline */}
            <div className="left-content">
              <div className="map-section">
                <div className="section-header">
                  <h3>Mapa da Rota</h3>
                  <div className="metric-selector">
                    <button 
                      className={`metric-btn ${selectedMetric === 'velocidade' ? 'active' : ''}`}
                      onClick={() => setSelectedMetric('velocidade')}
                    >
                      Velocidade
                    </button>
                    <button 
                      className={`metric-btn ${selectedMetric === 'emissao' ? 'active' : ''}`}
                      onClick={() => setSelectedMetric('emissao')}
                    >
                      Emissões
                    </button>
                    <button 
                      className={`metric-btn ${selectedMetric === 'iqar' ? 'active' : ''}`}
                      onClick={() => setSelectedMetric('iqar')}
                    >
                      IQAr
                    </button>
                  </div>
                </div>
                
                {/* Componente de mapa real com Leaflet */}
                <RouteMap
                  routePoints={routePoints}
                  selectedMetric={selectedMetric}
                  linha={photoData.linha}
                  iqar={photoData.iqar}
                />
                
                <div className="map-legend">
                  <div className="legend-item">
                    <input 
                      type="checkbox" 
                      id="velocidade" 
                      checked={selectedMetric === 'velocidade'}
                      onChange={() => setSelectedMetric('velocidade')}
                    />
                    <label htmlFor="velocidade">
                      <span className="legend-color" style={{background: '#4CAF50'}}></span>
                      Velocidade média
                    </label>
                  </div>
                  <div className="legend-item">
                    <input 
                      type="checkbox" 
                      id="emissao"
                      checked={selectedMetric === 'emissao'}
                      onChange={() => setSelectedMetric('emissao')}
                    />
                    <label htmlFor="emissao">
                      <span className="legend-color" style={{background: '#FF5722'}}></span>
                      Emissão de carbono
                    </label>
                  </div>
                  <div className="legend-item">
                    <input 
                      type="checkbox" 
                      id="iqar"
                      checked={selectedMetric === 'iqar'}
                      onChange={() => setSelectedMetric('iqar')}
                    />
                    <label htmlFor="iqar">
                      <span className="legend-color" style={{background: '#2196F3'}}></span>
                      IQAr médio do itinerário
                    </label>
                  </div>
                </div>
              </div>

              <div className="timeline-section">
                <div className="section-header">
                  <h3>Timeline de Emissões</h3>
                  <button className="date-btn">
                    <FiCalendar /> {photoData.data}
                  </button>
                </div>

                <div className="emissions-chart">
                  <div className="chart-header">
                    <h4>Emissões de CO₂ (kg)</h4>
                    <div className="chart-legend-inline">
                      <span><span className="dot red"></span> Alta</span>
                      <span><span className="dot yellow"></span> Média</span>
                      <span><span className="dot green"></span> Baixa</span>
                    </div>
                  </div>
                  
                  <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EA4335" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#EA4335" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FBBC04" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#FBBC04" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#34A853" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#34A853" stopOpacity="0.05"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1"/>
                    
                    {/* Red line (Alta) */}
                    <path
                      d="M0,150 L100,130 L200,100 L300,80 L400,110 L500,120 L600,140"
                      fill="url(#redGradient)"
                      stroke="none"
                    />
                    <polyline
                      points="0,150 100,130 200,100 300,80 400,110 500,120 600,140"
                      fill="none"
                      stroke="#EA4335"
                      strokeWidth="3"
                    />
                    
                    {/* Yellow line (Média) */}
                    <path
                      d="M0,160 L100,145 L200,120 L300,110 L400,130 L500,140 L600,155 L600,200 L0,200"
                      fill="url(#yellowGradient)"
                      stroke="none"
                    />
                    <polyline
                      points="0,160 100,145 200,120 300,110 400,130 500,140 600,155"
                      fill="none"
                      stroke="#FBBC04"
                      strokeWidth="3"
                    />
                    
                    {/* Green line (Baixa) */}
                    <path
                      d="M0,170 L100,168 L200,160 L300,155 L400,162 L500,165 L600,172 L600,200 L0,200"
                      fill="url(#greenGradient)"
                      stroke="none"
                    />
                    <polyline
                      points="0,170 100,168 200,160 300,155 400,162 500,165 600,172"
                      fill="none"
                      stroke="#34A853"
                      strokeWidth="3"
                    />
                    
                    {/* Data points */}
                    <circle cx="300" cy="80" r="5" fill="#EA4335" stroke="white" strokeWidth="2"/>
                    <circle cx="400" cy="130" r="5" fill="#FBBC04" stroke="white" strokeWidth="2"/>
                    <circle cx="500" cy="165" r="5" fill="#34A853" stroke="white" strokeWidth="2"/>
                  </svg>
                  
                  <div className="chart-footer">
                    <span className="chart-axis-label">Segunda</span>
                    <span className="chart-axis-label">Terça</span>
                    <span className="chart-axis-label">Quarta</span>
                    <span className="chart-axis-label">Quinta</span>
                    <span className="chart-axis-label">Sexta</span>
                    <span className="chart-axis-label">Sábado</span>
                    <span className="chart-axis-label">Domingo</span>
                  </div>
                  
                  <div className="chart-controls">
                    <button className="chart-toggle">Última semana</button>
                    <button className="chart-toggle">Último mês</button>
                    <button className="chart-toggle active">Último ano</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita - Dados comparativos e fotos salvas */}
            <div className="right-content">
              <div className="comparative-card">
                <h3>Dados Comparativos</h3>
                <div className="time-filters">
                  <button className="time-filter">Dia</button>
                  <button className="time-filter active">Semana</button>
                  <button className="time-filter">Mês</button>
                  <button className="time-filter">Ano</button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: '#E3F2FD'}}>
                      <span style={{color: '#2196F3'}}>🚌</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Velocidade Média</span>
                      <span className="stat-value">{photoData.velocidadeMedia} km/h</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: '#FFEBEE'}}>
                      <span style={{color: '#F44336'}}>☁️</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">CO₂ Emitido</span>
                      <span className="stat-value">{photoData.emissaoCarbono} kg</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: '#E8F5E9'}}>
                      <span style={{color: '#4CAF50'}}>🍃</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">IQAr Médio</span>
                      <span className="stat-value">{photoData.iqar}</span>
                    </div>
                  </div>
                </div>

                <div className="pie-chart-container">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="70" 
                      fill="none" 
                      stroke="#EA4335" 
                      strokeWidth="25" 
                      strokeDasharray="145 440" 
                      transform="rotate(-90 90 90)"
                    />
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="70" 
                      fill="none" 
                      stroke="#FBBC04" 
                      strokeWidth="25" 
                      strokeDasharray="145 440" 
                      strokeDashoffset="-145"
                      transform="rotate(-90 90 90)"
                    />
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="70" 
                      fill="none" 
                      stroke="#34A853" 
                      strokeWidth="25" 
                      strokeDasharray="150 440" 
                      strokeDashoffset="-290"
                      transform="rotate(-90 90 90)"
                    />
                    <text x="90" y="85" textAnchor="middle" className="chart-center-text" fontSize="32" fontWeight="bold" fill="#2c3e50">
                      {photoData.iqar}
                    </text>
                    <text x="90" y="105" textAnchor="middle" className="chart-center-subtext" fontSize="12" fill="#6b7280">
                      IQAr Médio
                    </text>
                  </svg>
                </div>

                <div className="chart-legend-horizontal">
                  <div className="legend-h-item">
                    <span className="legend-dot" style={{background: '#EA4335'}}></span>
                    <span>Alta emissão</span>
                  </div>
                  <div className="legend-h-item">
                    <span className="legend-dot" style={{background: '#FBBC04'}}></span>
                    <span>Média emissão</span>
                  </div>
                  <div className="legend-h-item">
                    <span className="legend-dot" style={{background: '#34A853'}}></span>
                    <span>Baixa emissão</span>
                  </div>
                </div>
              </div>

              <div className="saved-photos-card">
                <div className="card-header">
                  <h3>Fotografias Salvas</h3>
                  <span className="photo-count">{savedPhotos.length} fotos</span>
                </div>
                
                <div className="photo-grid">
                  {paginatedPhotos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.thumbnail} alt={`Frota ${photo.linha}`} className="photo-thumbnail" />
                      <div className="photo-info">
                        <div className="photo-details">
                          <span className="photo-line">Linha {photo.linha}</span>
                          <span className="photo-date">{photo.data}</span>
                        </div>
                        <span className="photo-speed">{photo.velocidade}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </button>
                    <span className="page-info">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      className="pagination-btn"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetPhotosPage;