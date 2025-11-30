import { useState, useEffect } from 'react';
import { linesService } from '../services/linesService';
import { routesService } from '../services/routesService';
import '../style/SaveRouteModal.css';

interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineId?: number;
  lineName?: string;
  onSaved?: () => void;
}

import type { Stop } from '../types/api.types';

const SaveRouteModal: React.FC<SaveRouteModalProps> = ({ isOpen, onClose, lineId, lineName, onSaved }) => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [departureStopId, setDepartureStopId] = useState<number | null>(null);
  const [arrivalStopId, setArrivalStopId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStops, setLoadingStops] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lineId) {
      loadStops();
      setDepartureStopId(null);
      setArrivalStopId(null);
    }
  }, [isOpen, lineId]);

  const loadStops = async () => {
    if (!lineId) return;
    
    setLoadingStops(true);
    setError(null);
    try {
      const stopsData = await linesService.getLineStops(lineId);
      setStops(stopsData);
    } catch (err) {
      console.error('Erro ao carregar paradas:', err);
      setError('Erro ao carregar paradas da linha');
    } finally {
      setLoadingStops(false);
    }
  };

  const handleSave = async () => {
    if (!lineId || !departureStopId || !arrivalStopId) {
      setError('Por favor, selecione origem e destino');
      return;
    }

    if (departureStopId === arrivalStopId) {
      setError('Origem e destino devem ser diferentes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await routesService.createRoute({
        line_id: lineId,
        departure_stop_id: departureStopId,
        arrival_stop_id: arrivalStopId,
      });
      
      onSaved?.();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Erro ao salvar rota:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar rota. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDepartureStopId(null);
    setArrivalStopId(null);
    setStops([]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Salvar Rota no Histórico</h2>
            {lineName && (
              <p style={{ margin: '4px 0 0 0', color: '#757575', fontSize: '0.9rem' }}>
                Linha: <strong>{lineName}</strong>
              </p>
            )}
          </div>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="modal-error">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          {loadingStops ? (
            <div className="modal-loading">Carregando paradas...</div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="departure">Parada de Origem:</label>
                <select
                  id="departure"
                  value={departureStopId || ''}
                  onChange={(e) => setDepartureStopId(Number(e.target.value))}
                  disabled={loading}
                >
                  <option value="">Selecione a origem</option>
                  {stops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="arrival">Parada de Destino:</label>
                <select
                  id="arrival"
                  value={arrivalStopId || ''}
                  onChange={(e) => setArrivalStopId(Number(e.target.value))}
                  disabled={loading}
                >
                  <option value="">Selecione o destino</option>
                  {stops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={loading || loadingStops || !departureStopId || !arrivalStopId}
          >
            {loading ? 'Salvando...' : 'Salvar Rota'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveRouteModal;
