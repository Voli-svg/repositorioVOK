import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth';
import './Matches.css'; // Asegúrate de crear este CSS (abajo te lo dejo)

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  
  // Forms Data
  const [newMatch, setNewMatch] = useState({ opponent: '', match_date: '', location: '', type: 'liga' });
  const [editingMatch, setEditingMatch] = useState(null); // El partido al que le ponemos resultado
  const [scoreData, setScoreData] = useState({ our_set_score: 0, opp_set_score: 0 });

  // 1. Cargar Datos
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
    fetchMatches();
  }, []);

  const fetchMatches = () => {
    fetch('http://127.0.0.1:8000/api/matches')
      .then(res => res.json())
      .then(data => setMatches(data));
  };

  // 2. Permisos
  const canEdit = hasRole(currentUser, ['coach', 'admin', 'super_admin']);

  // 3. Crear Partido
  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch('http://127.0.0.1:8000/api/matches', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newMatch)
    });
    setShowCreateModal(false);
    fetchMatches();
    setNewMatch({ opponent: '', match_date: '', location: '', type: 'liga' });
  };

  // 4. Actualizar Resultado
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    await fetch(`http://127.0.0.1:8000/api/matches/${editingMatch.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(scoreData)
    });
    setShowScoreModal(false);
    fetchMatches();
  };

  const openScoreModal = (match) => {
    setEditingMatch(match);
    setScoreData({ our_set_score: match.our_set_score || 0, opp_set_score: match.opp_set_score || 0 });
    setShowScoreModal(true);
  };

  // 5. Borrar
  const handleDelete = async (id) => {
    if(!window.confirm("¿Eliminar este partido?")) return;
    await fetch(`http://127.0.0.1:8000/api/matches/${id}`, { method: 'DELETE' });
    fetchMatches();
  };

  // Formato de fecha bonito
  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="matches-container">
      <div className="matches-header">
        <h2>🏐 Calendario y Resultados</h2>
        {canEdit && (
            <button className="btn-add" onClick={() => setShowCreateModal(true)}>
                + Programar Partido
            </button>
        )}
      </div>

      <div className="matches-grid">
        {matches.map(match => (
            <div key={match.id} className={`match-card ${match.status}`}>
                <div className="match-top">
                    <span className="match-type">{match.type.toUpperCase()}</span>
                    <span className="match-date">{formatDate(match.match_date)}</span>
                </div>

                <div className="scoreboard">
                    <div className="team">
                        <span className="team-name">NOSOTROS</span>
                        <span className="score">{match.status === 'finished' ? match.our_set_score : '-'}</span>
                    </div>
                    <div className="vs">VS</div>
                    <div className="team">
                        <span className="team-name">{match.opponent}</span>
                        <span className="score">{match.status === 'finished' ? match.opp_set_score : '-'}</span>
                    </div>
                </div>

                <div className="match-footer">
                    <p>📍 {match.location}</p>
                    
                    {/* ACCIONES SOLO PARA ENTRENADOR/ADMIN */}
                    {canEdit && (
                        <div className="admin-actions">
                            <button className="btn-edit" onClick={() => openScoreModal(match)}>
                                ✏️ {match.status === 'finished' ? 'Editar Marcador' : 'Poner Resultado'}
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(match.id)}>
                                🗑️
                            </button>
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>

      {/* --- MODAL CREAR --- */}
      {showCreateModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Programar Nuevo Partido</h3>
                <form onSubmit={handleCreate} className="modal-form">
                    <div className="form-group">
                        <label>Rival:</label>
                        <input required placeholder="Ej: Club Leones" onChange={e => setNewMatch({...newMatch, opponent: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Fecha y Hora:</label>
                        <input type="datetime-local" required onChange={e => setNewMatch({...newMatch, match_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Lugar:</label>
                        <input required placeholder="Ej: Gimnasio Municipal" onChange={e => setNewMatch({...newMatch, location: e.target.value})} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="modal-btn btn-cancel" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                        <button type="submit" className="modal-btn btn-submit">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL RESULTADO --- */}
      {showScoreModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Actualizar Marcador</h3>
                <p style={{textAlign:'center', marginBottom: 20}}>Vs {editingMatch?.opponent}</p>
                
                <form onSubmit={handleScoreSubmit} className="modal-form">
                    <div style={{display:'flex', gap: 20, justifyContent: 'center'}}>
                        <div className="form-group" style={{textAlign:'center'}}>
                            <label>Nosotros (Sets)</label>
                            <input type="number" min="0" max="5" style={{width: 80, textAlign: 'center', fontSize: 20}} 
                                value={scoreData.our_set_score}
                                onChange={e => setScoreData({...scoreData, our_set_score: e.target.value})} 
                            />
                        </div>
                        <div className="form-group" style={{textAlign:'center'}}>
                            <label>Rival (Sets)</label>
                            <input type="number" min="0" max="5" style={{width: 80, textAlign: 'center', fontSize: 20}}
                                value={scoreData.opp_set_score}
                                onChange={e => setScoreData({...scoreData, opp_set_score: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="modal-btn btn-cancel" onClick={() => setShowScoreModal(false)}>Cancelar</button>
                        <button type="submit" className="modal-btn btn-submit">Finalizar Partido</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}