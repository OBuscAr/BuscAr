import React, { useState, useEffect } from 'react';
import '../style/FleetPhotosPage.css';
import { FiSearch, FiMapPin, FiTrendingUp, FiCalendar, FiDownload } from 'react-icons/fi';
import RouteMap from '../components/RouteMap';
import { linesService } from '../services/linesService';
import { emissionsService } from '../services/emissionsService';
import type { Line } from '../types/api.types';
import Loading from '../components/Loading';

interface PhotoData {
  id: string;
  linha: string;
  lineNumber: string;
  velocidadeMedia: number;
  emissaoCarbono: number;
  distancia: number;
  data: string;
}

function FleetPhotosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{lat: number, lng: number, name?: string, value?: number}>>([]);
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'velocidade' | 'emissao'>('emissao');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar todas as linhas ao iniciar
  useEffect(() => {
    async function loadLines() {
      try {
        const lines = await linesService.searchLines('');
        setAllLines(lines);
      } catch (err) {
        console.error('Erro ao carregar linhas:', err);
      }
    }
    loadLines();
  }, []);

  // Filtrar linhas conforme o usuário digita
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const term = searchQuery.toLowerCase().trim();
      const filtered = allLines.filter(line => {
        const lineCode = line.name.toLowerCase();
        const description = line.description?.toLowerCase() || '';
        return lineCode.includes(term) || description.includes(term);
      }).slice(0, 10);
      setFilteredLines(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredLines([]);
    }
  }, [searchQuery, allLines]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, digite o número da linha');
      return;
    }

    setLoading(true);
    setError(null);
    setPhotoData(null);

    try {
      const lines = await linesService.searchLines(searchQuery.trim());
      
      if (lines.length === 0) {
        setError(`Linha "${searchQuery}" não encontrada`);
        setSelectedLine(null);
        return;
      }

      const line = lines[0];
      setSelectedLine(line);

      const stops = await linesService.getLineStops(line.id);
      console.log(`Paradas encontradas para linha ${line.name}:`, stops.length);
      
      const points = stops.map((stop) => ({
        lat: stop.latitude,
        lng: stop.longitude,
        name: stop.name,
        value: undefined
      }));
      setRoutePoints(points);
      
      if (stops.length === 0) {
        console.warn('Nenhuma parada encontrada para esta linha');
      }

      const emissionData = await emissionsService.getTotalLineEmission(line.name);
      
      if (emissionData.length === 0) {
        setError('Dados de emissão não disponíveis para esta linha');
        return;
      }

      const lineEmission = emissionData.find(e => e.line.id === line.id) || emissionData[0];

      const data: PhotoData = {
        id: line.id.toString(),
        linha: line.description || line.name,
        lineNumber: line.name,
        velocidadeMedia: 0,
        emissaoCarbono: lineEmission.emission,
        distancia: lineEmission.distance,
        data: new Date().toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      };

      setPhotoData(data);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.response?.data?.detail || 'Erro ao buscar dados da linha');
      setSelectedLine(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExportData = () => {
    if (!photoData) {
      alert('Nenhum dado para exportar. Por favor, busque uma linha primeiro.');
      return;
    }
    
    const csvContent = `Linha,Descrição,Emissão CO2 (kg),Distância (km),Emissão por km (kg/km),Data\n` +
      `${photoData.lineNumber},"${photoData.linha}",${photoData.emissaoCarbono.toFixed(2)},${photoData.distancia.toFixed(2)},${(photoData.emissaoCarbono / photoData.distancia).toFixed(3)},${photoData.data}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `frota_${photoData.lineNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('📊 Dados exportados com sucesso!');
  };

  return (
    <div className="fleet-photos-container">
      <div className="photos-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Análise de Linhas de Ônibus</h1>
            <p>Visualize e analise dados de emissões das linhas de transporte público</p>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-input-wrapper" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Digite o número da linha (ex: 8055-10)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="search-input"
          />
          {showSuggestions && filteredLines.length > 0 && (
            <div className="search-suggestions">
              {filteredLines.map((line) => (
                <div
                  key={line.id}
                  className="suggestion-item"
                  onClick={() => {
                    setSearchQuery(line.name);
                    setShowSuggestions(false);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  <strong>{line.name}</strong>
                  {line.description && <span> - {line.description}</span>}
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '8px' }}>
                    ({line.direction === 'MAIN' ? 'Ida' : 'Volta'})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="search-buttons">
          <button className="search-btn primary" onClick={handleSearch} disabled={loading}>
            <FiSearch /> {loading ? 'Buscando...' : 'Buscar Linha'}
          </button>
          <button 
            className="search-btn secondary" 
            onClick={handleExportData}
            disabled={!photoData}
          >
            <FiDownload /> Exportar Dados
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading />
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          borderRadius: 8,
          fontSize: '14px',
          margin: '1rem 0'
        }}>
          ⚠️ {error}
        </div>
      )}

      {selectedLine && photoData && !loading && (
        <div className="results-container">
          <div className="results-header">
            <h2>
              <FiMapPin className="header-icon" />
              Resultados para a linha "{selectedLine.name}" - {selectedLine.description}
            </h2>
            <div className="results-meta">
              <span className="meta-item">
                <FiCalendar /> {photoData.data}
              </span>
              <span className="meta-item">
                <FiTrendingUp /> Distância: {photoData.distancia.toFixed(2)}km
              </span>
            </div>
          </div>

          <div className="content-layout">
            <div className="left-content">
              <div className="map-section">
                <div className="section-header">
                  <h3>Mapa da Rota</h3>
                </div>
                
                {routePoints.length > 0 && (
                  <div style={{ 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#0369a1'
                  }}>
                    📍 {routePoints.length} paradas nesta linha
                  </div>
                )}

                <RouteMap
                  mode="line"
                  routePoints={routePoints}
                  selectedMetric={selectedMetric}
                  linha={selectedLine.name}
                />
              </div>
            </div>

            <div className="right-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📏</div>
                  <div className="stat-content">
                    <div className="stat-label">Distância Total</div>
                    <div className="stat-value">{photoData.distancia.toFixed(2)} km</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🌱</div>
                  <div className="stat-content">
                    <div className="stat-label">CO₂ Emitido</div>
                    <div className="stat-value">{photoData.emissaoCarbono.toFixed(2)} kg</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Emissão/km</div>
                    <div className="stat-value">
                      {(photoData.emissaoCarbono / photoData.distancia).toFixed(3)} kg/km
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetPhotosPage;
