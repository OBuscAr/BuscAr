import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/EmissionHistoryPage.css';
import { FiSearch } from 'react-icons/fi';
import { routesService } from '../services/routesService';
import Loading from '../components/Loading';

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
          const emissionPerKm = route.distance > 0 ? route.emission / route.distance : Infinity;
          
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
            emissionPerKm
          };
        });

        // Ordenar por menor emissão por km (mais eficiente = ranking melhor)
        const sortedRoutes = routesWithEfficiency.sort((a, b) => a.emissionPerKm - b.emissionPerKm);
        
        // Atribuir ranking baseado na eficiência
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

  const handleDelete = async (routeId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta rota do histórico?')) {
      try {
        await routesService.deleteRoute(routeId);
        // Remove da lista local
        setEmissionData(prevData => prevData.filter(record => record.id !== routeId));
      } catch (error) {
        console.error('Erro ao deletar rota:', error);
        alert('Erro ao deletar rota. Tente novamente.');
      }
    }
  };

  return (
    <div className="emission-history-container">
      <div className="history-header">
        <div className="header-text">
          <h1>Histórico de emissões</h1>
          <p>Como está seu ar hoje?</p>
        </div>
        <button className="new-search-button" onClick={handleNewSearch}>
          Buscar +
        </button>
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
                        -{record.emissionSaving.toFixed(2)} kg
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
    </div>
  );
}

export default EmissionHistoryPage;