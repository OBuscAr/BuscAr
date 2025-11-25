import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/EmissionHistoryPage.css';
import { FiSearch } from 'react-icons/fi';

interface EmissionRecord {
  id: string;
  linha: string;
  origem: string;
  destino: string;
  ranking: number;
  data: string;
  carbono: string;
  velocidadeMedia: string;
  acao: string;
}

function EmissionHistoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [emissionData, setEmissionData] = useState<EmissionRecord[]>([]);

  // Carregar dados (simulando API call)
  useEffect(() => {
    const loadEmissionData = async () => {
      setIsLoading(true);
      try {
        // TODO: Substituir por chamada real à API quando disponível
        // const response = await fetch('/api/emission-history');
        // const data = await response.json();
        // setEmissionData(data);
        
        // Dados mockados por enquanto
        setTimeout(() => {
          const mockData: EmissionRecord[] = [
            {
              id: '8705-10',
              linha: '8705-10',
              origem: 'São Continental',
              destino: 'Anhangabaú',
              ranking: 1,
              data: '24 Junho, 2025',
              carbono: '45.2 µg/m³',
              velocidadeMedia: '32 km/h',
              acao: 'download'
            },
            {
              id: '8745-10',
              linha: '8745-10',
              origem: 'São Continental',
              destino: 'Dharco MMDC',
              ranking: 2,
              data: '24 Agosto, 2025',
              carbono: '52.8 µg/m³',
              velocidadeMedia: '28 km/h',
              acao: 'download'
            },
            {
              id: '875C-10',
              linha: '875C-10',
              origem: 'Lapa',
              destino: 'Santa Cruz',
              ranking: 3,
              data: '18 Dezembro, 2024',
              carbono: '58.3 µg/m³',
              velocidadeMedia: '25 km/h',
              acao: 'download'
            },
            {
              id: '8086',
              linha: '8086',
              origem: 'Lapa',
              destino: 'Pinheiros',
              ranking: 4,
              data: '8 Outubro, 2025',
              carbono: '63.7 µg/m³',
              velocidadeMedia: '22 km/h',
              acao: 'download'
            },
            {
              id: '8082',
              linha: '8082',
              origem: 'Cid. Universitária',
              destino: 'Butantã',
              ranking: 5,
              data: '15 Junho, 2025',
              carbono: '71.5 µg/m³',
              velocidadeMedia: '19 km/h',
              acao: 'download'
            },
            {
              id: '8084',
              linha: '8084',
              origem: 'Cid. Universitária',
              destino: 'Butantã',
              ranking: 6,
              data: '12 Julho, 2025',
              carbono: '78.2 µg/m³',
              velocidadeMedia: '17 km/h',
              acao: 'download'
            },
            {
              id: '8085',
              linha: '8085',
              origem: 'Cid. Universitária',
              destino: 'Rio Pequeno',
              ranking: 7,
              data: '21 Julho, 2025',
              carbono: '85.9 µg/m³',
              velocidadeMedia: '15 km/h',
              acao: 'download'
            },
            {
              id: '8090',
              linha: '8090',
              origem: 'Pinheiros',
              destino: 'Consolação',
              ranking: 8,
              data: '5 Setembro, 2025',
              carbono: '92.4 µg/m³',
              velocidadeMedia: '13 km/h',
              acao: 'download'
            },
          ];
          setEmissionData(mockData);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      }
    };

    loadEmissionData();
  }, []);

  const filteredData = emissionData.filter(record =>
    record.linha.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.origem.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.destino.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset para primeira página
  };

  const handleNewSearch = () => {
    // Navega para a página de busca/dashboard
    navigate('/painel/');
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

  const handleDelete = (recordId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro do histórico?')) {
      // TODO: Implementar chamada à API para deletar
      setEmissionData(prevData => prevData.filter(record => record.id !== recordId));
      
      // Ajusta a página atual se necessário
      const newFilteredLength = filteredData.filter(r => r.id !== recordId).length;
      const newTotalPages = Math.ceil(newFilteredLength / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
  };

  // Reset para primeira página quando a busca muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          <FiSearch className="search-icon" />
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
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando histórico...</p>
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
                    <th>Carbono</th>
                    <th>Velocidade Média</th>
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
                      <td>{record.data}</td>
                      <td>{record.carbono}</td>
                      <td>{record.velocidadeMedia}</td>
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
                Itens por pág:
                <select 
                  value={itemsPerPage} 
                  onChange={handleItemsPerPageChange}
                  className="items-per-page"
                >
                  <option value="5">5</option>
                  <option value="7">7</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="pagination-controls">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                  title="Página anterior"
                >
                  ‹
                </button>
                <span className="page-info">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="pagination-btn"
                  title="Próxima página"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmissionHistoryPage;