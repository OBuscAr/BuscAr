import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/EmissionHistoryPage.css';
import { FiSearch, FiX } from 'react-icons/fi';
import { routesService } from '../services/routesService';
import { linesService } from '../services/linesService';
import type { Line, Stop } from '../types/api.types';
import { VehicleType } from '../types/api.types';
import Loading from '../components/Loading';
import { emissionsService } from '../services/emissionsService';

interface EmissionRecord {
  id: string;
  linha: string;
  origem: string;
  destino: string;
  ranking: number;
  data: string;
  carbono: number;
  distance: number;
  emissionSaving: number;
  acao: string;
}

function EmissionHistoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [emissionData, setEmissionData] = useState<EmissionRecord[]>([]);
  const [authError, setAuthError] = useState(false);

  // Estados para análise de rota
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [departureStopId, setDepartureStopId] = useState<number | null>(null);
  const [arrivalStopId, setArrivalStopId] = useState<number | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchLineTerm, setSearchLineTerm] = useState('');

  // Carregar linhas quando abrir o modal
  useEffect(() => {
    const loadLines = async () => {
      try {
        const linesData = await linesService.searchLines('');
        setLines(linesData);
      } catch (error) {
        console.error('Erro ao carregar linhas:', error);
      }
    };

    if (showAnalyzeModal && lines.length === 0) {
      loadLines();
    }
  }, [showAnalyzeModal]);

  // Carregar paradas quando selecionar uma linha
  useEffect(() => {
    const loadStops = async () => {
      setDepartureStopId(null);
      setArrivalStopId(null);
      setRouteAnalysis(null);
      setStops([]);
      if (!selectedLine) return;

      try {
        const stopsData = await linesService.getLineStops(selectedLine.id);
        setStops(stopsData);
        setDepartureStopId(null);
        setArrivalStopId(null);
        setRouteAnalysis(null);
      } catch (error) {
        console.error('Erro ao carregar paradas:', error);
      }
    };

    loadStops();
  }, [selectedLine]);

  // Carregar rotas salvas do usuário
  useEffect(() => {
    const loadRoutes = async () => {
      setIsLoading(true);
      setAuthError(false);
      try {
        const routes = await routesService.getRoutes();

        // Mapear rotas para o formato do componente e calcular emissão por km
        const routesWithEfficiency = routes.map(route => {
          const lineCode = route.line.name.split(' - ')[0];

          return {
            id: route.id,
            linha: lineCode,
            origem: route.departure_stop.name,
            destino: route.arrival_stop.name,
            data: route.created_at,
            carbono: route.emission,
            distance: route.distance,
            emissionSaving: route.emission_saving,
            acao: 'download',
          };
        });

        // Ordenar por maior economia
        const sortedRoutes = routesWithEfficiency.sort((a, b) => b.emissionSaving - a.emissionSaving);

        // Atribuir ranking baseado na economia
        const records: EmissionRecord[] = sortedRoutes.map((route, index) => ({
          id: route.id,
          linha: route.linha,
          origem: route.origem,
          destino: route.destino,
          ranking: index + 1,
          data: route.data,
          carbono: route.carbono,
          distance: route.distance,
          emissionSaving: route.emissionSaving,
          acao: route.acao
        }));

        setEmissionData(records);
      } catch (error: any) {
        console.error('Erro ao carregar rotas:', error);
        // Detecta erro 401 (não autenticado)
        if (error.response?.status === 401) {
          setAuthError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutes();
  }, []);

  useEffect(() => {
    const element = document.getElementById('analysis');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

  }, [routeAnalysis]);

  // Filtrar dados com base na busca
  const filteredData = searchQuery.trim()
    ? emissionData.filter(record =>
      record.linha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.origem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.destino.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : emissionData;

  const paginatedData = filteredData;

  // Calcula o ranking máximo para normalizar a barra
  const maxRanking = Math.max(...emissionData.map(r => r.ranking), 1);

  const getRankingColor = (ranking: number) => {
    const percentage = (ranking / maxRanking) * 100;
    if (percentage <= 33) return '#22c55e'; // Verde
    if (percentage <= 66) return '#eab308'; // Amarelo
    return '#ef4444'; // Vermelho
  };

  const getRankingWidth = (ranking: number) => {
    return ((maxRanking - ranking + 1) / maxRanking) * 100;
  };

  const handleNewSearch = () => {
    // Navega para a página de busca/dashboard
    navigate('/painel/comparativos');
  };

  const handleDownload = (record: EmissionRecord) => {
    // TODO: Implementar download real dos dados
    const dataStr = JSON.stringify(record, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emissao-${record.linha}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reorderRoutes = async () => {
    const sortedRecords = emissionData.slice().sort((a, b) => b.emissionSaving - a.emissionSaving);

    // Atribuir ranking baseado na economia
    const records: EmissionRecord[] = sortedRecords.map((record, index) => ({
      id: record.id,
      linha: record.linha,
      origem: record.origem,
      destino: record.destino,
      ranking: index + 1,
      data: record.data,
      carbono: record.carbono,
      distance: record.distance,
      emissionSaving: record.emissionSaving,
      acao: record.acao
    }));

    setEmissionData(records);
  };


  const handleDelete = async (routeId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta rota do histórico?')) {
      try {
        await routesService.deleteRoute(routeId);
        // Remove da lista local
        setEmissionData(prevData => prevData.filter(record => record.id !== routeId));
        reorderRoutes();
      } catch (error) {
        console.error('Erro ao deletar rota:', error);
        alert('Erro ao deletar rota. Tente novamente.');
      }
    }
  };

  const handleAnalyzeRoute = async () => {
    if (!selectedLine || !departureStopId || !arrivalStopId) {
      alert('Por favor, selecione uma linha e as paradas de origem e destino.');
      return;
    }

    if (departureStopId === arrivalStopId) {
      alert('As paradas de origem e destino devem ser diferentes.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const busEmission = await emissionsService.calculateEmissionBetweenStops(
        selectedLine.id,
        departureStopId,
        arrivalStopId,
        VehicleType.BUS,
      );

      const carEmission = await emissionsService.calculateEmissionBetweenStops(
        selectedLine.id,
        departureStopId,
        arrivalStopId,
        VehicleType.CAR,
      );


      setRouteAnalysis({
        lineId: selectedLine.id,
        departureStopId: departureStopId,
        arrivalStopId: arrivalStopId,
        line: selectedLine.name,
        departureStop: stops.find(s => s.id === departureStopId)?.name || '',
        arrivalStop: stops.find(s => s.id === arrivalStopId)?.name || '',
        distance: busEmission.distance_km,
        busEmission: busEmission.emission_kg_co2,
        carEmission: carEmission.emission_kg_co2,
        saving: carEmission.emission_kg_co2 - busEmission.emission_kg_co2,
      });
    } catch (error) {
      console.error('Erro ao analisar rota:', error);
      alert('Erro ao analisar rota. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeAnalysis) {
      alert('Por favor, analise uma rota.');
      return;
    }

    setIsSaving(true);
    try {
      // Buscar dados da rota (cria temporariamente para obter os cálculos)
      const route = await routesService.createRoute({
        line_id: routeAnalysis.lineId,
        departure_stop_id: routeAnalysis.departureStopId,
        arrival_stop_id: routeAnalysis.arrivalStopId
      });

      // Adiciona à lista local
      const newRecord: EmissionRecord = {
        id: route.id,
        linha: routeAnalysis.line.split(' - ')[0],
        origem: routeAnalysis.departureStop,
        destino: routeAnalysis.arrivalStop,
        ranking: emissionData.length + 1,
        data: route.created_at,
        carbono: route.emission,
        distance: route.distance,
        emissionSaving: route.emission_saving,
        acao: 'download'
      };

      setEmissionData(prev => [...prev, newRecord]);
      reorderRoutes();
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      alert('Erro ao criar rota. Tente novamente.');
    } finally {
      setIsSaving(false);
      alert('Rota salva com sucesso no histórico!');
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setShowAnalyzeModal(false);
    setSelectedLine(null);
    setStops([]);
    setDepartureStopId(null);
    setArrivalStopId(null);
    setRouteAnalysis(null);
    setSearchLineTerm('');
  };

  const filteredLines = searchLineTerm.trim()
    ? lines.filter(line =>
      line.name.toLowerCase().includes(searchLineTerm.toLowerCase()) ||
      line.description?.toLowerCase().includes(searchLineTerm.toLowerCase())
    )
    : lines;

  return (
    <div className="emission-history-container">
      <div className="history-header">
        <div className="header-text">
          <h1>Histórico de emissões</h1>
          <p>Como está seu ar hoje?</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="new-search-button"
            onClick={() => setShowAnalyzeModal(true)}
            style={{ backgroundColor: '#10b981' }}
          >
            Analisar Rota
          </button>
          <button className="new-search-button" onClick={handleNewSearch}>
            Buscar + dados
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="O que você busca?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="history-table-container">
        <h2>Histórico de linhas</h2>

        {isLoading ? (
          <Loading />
        ) : authError ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ef4444' }}>
              ⚠️ Você precisa fazer login para acessar seu histórico de rotas
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Ir para Login
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchQuery
                ? 'Nenhum resultado encontrado para sua busca.'
                : 'Nenhum histórico de emissões disponível.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Ranking</th>
                    <th>Data</th>
                    <th>Emissões</th>
                    <th>Distância</th>
                    <th>Economia CO₂</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="line-info">
                          <span className="line-number">{record.linha}</span>
                          <div className="line-route">
                            {record.origem && <span className="route-origin">{record.origem}</span>}
                            {record.origem && record.destino && <span className="route-arrow">↔</span>}
                            {record.destino && <span className="route-destination">{record.destino}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ranking-bar-container">
                          <div className="ranking-bar">
                            <div
                              className="ranking-fill"
                              style={{
                                width: `${getRankingWidth(record.ranking)}%`,
                                backgroundColor: getRankingColor(record.ranking)
                              }}
                            />
                          </div>
                          <span className="ranking-number">#{record.ranking}</span>
                        </div>
                      </td>
                      <td>{new Date(record.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                      <td>{record.carbono.toFixed(2)} kg CO₂</td>
                      <td>{record.distance.toFixed(2)} km</td>
                      <td style={{ color: '#22c55e', fontWeight: 'bold' }}>
                        {record.emissionSaving.toFixed(2)} kg
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn download-btn"
                            title="Baixar"
                            onClick={() => handleDownload(record)}
                          >
                            ⬇
                          </button>
                          <button
                            className="action-btn delete-btn"
                            title="Excluir"
                            onClick={() => handleDelete(record.id)}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                <span className="page-info">
                  {filteredData.length} {filteredData.length === 1 ? 'rota salva' : 'rotas salvas'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Análise de Rota */}
      {showAnalyzeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <FiX />
            </button>

            <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Analisar uma Rota</h2>

            {/* Busca de Linha */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                Buscar Linha:
              </label>
              <input
                type="text"
                placeholder="Digite o número ou nome da linha"
                value={searchLineTerm}
                onChange={(e) => setSearchLineTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {searchLineTerm.trim() && filteredLines.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#64748b'
                }}>
                  {filteredLines.length} {filteredLines.length === 1 ? 'linha encontrada' : 'linhas encontradas'}
                </div>
              )}
              {searchLineTerm.trim() && filteredLines.length === 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  Nenhuma linha encontrada
                </div>
              )}
            </div>

            {/* Seleção de Linha - só mostra se tiver resultados */}
            {(searchLineTerm.trim() === '' || filteredLines.length > 0) && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                  Linha:
                </label>
                <select
                  value={selectedLine?.id || ''}
                  onChange={(e) => {
                    const line = lines.find(l => l.id === Number(e.target.value));
                    setSelectedLine(line || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione uma linha</option>
                  {filteredLines.slice(0, 50).map(line => (
                    <option key={line.id} value={line.id}>
                      {line.name} {line.description && `- ${line.description}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parada de Origem */}
            {selectedLine && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                  Parada de Origem:
                </label>
                <select
                  value={departureStopId || ''}
                  onChange={(e) => setDepartureStopId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione a parada de origem</option>
                  {stops.map(stop => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parada de Destino */}
            {selectedLine && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                  Parada de Destino:
                </label>
                <select
                  value={arrivalStopId || ''}
                  onChange={(e) => setArrivalStopId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione a parada de destino</option>
                  {stops.map(stop => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão Analisar */}
            <button
              onClick={handleAnalyzeRoute}
              disabled={!selectedLine || !departureStopId || !arrivalStopId || isAnalyzing || isSaving}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: selectedLine && departureStopId && arrivalStopId && !isAnalyzing && !isSaving ? '#3b82f6' : '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: selectedLine && departureStopId && arrivalStopId && !isAnalyzing && !isSaving ? 'pointer' : 'not-allowed',
                marginBottom: '1rem'
              }}
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar'}
            </button>

            {/* Resultado da Análise */}
            <div id="analysis">
              {routeAnalysis && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #86efac'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#166534', fontSize: '1.1rem' }}>
                    ✅ Análise Concluída
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'white', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '600' }}>Distância:</span>
                      <span>{routeAnalysis.distance.toFixed(2)} km</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'white', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '600' }}>Emissão Ônibus:</span>
                      <span>{routeAnalysis.busEmission.toFixed(2)} kg CO₂</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'white', borderRadius: '6px' }}>
                      <span style={{ fontWeight: '600' }}>Emissão Carro:</span>
                      <span>{routeAnalysis.carEmission.toFixed(2)} kg CO₂</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '6px', fontWeight: '700' }}>
                      <span style={{ color: '#166534' }}>Economia:</span>
                      <span style={{ color: '#16a34a' }}>{routeAnalysis.saving.toFixed(2)} kg CO₂</span>
                    </div>
                  </div>

                  <div></div>
                  <button
                    onClick={handleSaveRoute}
                    disabled={isSaving || isAnalyzing}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: !isSaving && !isAnalyzing ? '#3b82f6' : '#94a3b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: !isSaving && !isAnalyzing ? 'pointer' : 'not-allowed',
                      marginTop: '1rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default EmissionHistoryPage;