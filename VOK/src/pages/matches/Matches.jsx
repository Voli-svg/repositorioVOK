import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth';
import './Matches.css';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  
  // Forms Data
  // CORREGIDO: Usamos 'rival', separamos fecha y hora
  const [newMatch, setNewMatch] = useState({ 
    rival: '', 
    match_date: '', 
    match_time: '', 
    location: '' 
  });

  const [editingMatch, setEditingMatch] = useState(null);
  
  // CORREGIDO: Nombres coinciden con la base de datos (score_local, score_visit)
  const [scoreData, setScoreData] = useState({ score_local: 0, score_visit: 0 });

  // 1. Cargar Datos
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
    fetchMatches();
  }, []);

  const fetchMatches = () => {
    fetch('http://127.0.0.1:8000/api/matches')
      .then(res => res.json())
      .then(data => setMatches(data))
      .catch(err => console.error("Error cargando partidos:", err));
  };

  // 2. Permisos
  const canEdit = hasRole(currentUser, ['coach', 'admin', 'super_admin']);

  // 3. Crear Partido
  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validamos que la hora esté presente
    if(!newMatch.match_time) {
        alert("Por favor ingresa la hora del partido");
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/matches', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newMatch) // Ahora envía { rival, match_date, match_time, location }
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
            return;
        }

        setShowCreateModal(false);
        fetchMatches();
        // Resetear formulario
        setNewMatch({ rival: '', match_date: '', match_time: '', location: '' });
        alert("¡Partido creado exitosamente!");

    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error de conexión con el servidor");
    }
  };

  // 4. Actualizar Resultado
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/matches/${editingMatch.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(scoreData)
        });

        if (!response.ok) throw new Error("Error al actualizar");

        setShowScoreModal(false);
        fetchMatches();
    } catch (error) {
        alert("No se pudo actualizar el marcador");
    }
  };

  const openScoreModal = (match) => {
    setEditingMatch(match);
    // CORREGIDO: Mapeamos los datos que vienen del backend a los inputs
    setScoreData({ 
        score_local: match.score_local || 0, 
        score_visit: match.score_visit || 0 
    });
    setShowScoreModal(true);
  };

  // 5. Borrar
  const handleDelete = async (id) => {
    if(!window.confirm("¿Eliminar este partido?")) return;
    await fetch(`http://127.0.0.1:8000/api/matches/${id}`, { method: 'DELETE' });
    fetchMatches();
  };

  // Formato de fecha bonito
  const formatDate = (dateString, timeString) => {
    if(!dateString) return "Fecha por definir";
    // Combinamos fecha y hora para el formato
    const fullDate = timeString ? `${dateString}T${timeString}` : dateString;
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' };
    return new Date(fullDate).toLocaleDateString('es-ES', options);
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
                    {/* Usamos status en lugar de type que no existe */}
                    <span className="match-type">{(match.status === 'scheduled' ? 'PROGRAMADO' : match.status).toUpperCase()}</span>
                    <span className="match-date">{formatDate(match.match_date, match.match_time)}</span>
                </div>

                <div className="scoreboard">
                    <div className="team">
                        <span className="team-name">NOSOTROS</span>
                        {/* CORREGIDO: score_local */}
                        <span className="score">{match.status === 'finished' ? match.score_local : '-'}</span>
                    </div>
                    <div className="vs">VS</div>
                    <div className="team">
                        {/* CORREGIDO: rival */}
                        <span className="team-name">{match.rival}</span>
                        {/* CORREGIDO: score_visit */}
                        <span className="score">{match.status === 'finished' ? match.score_visit : '-'}</span>
                    </div>
                </div>

                <div className="match-footer">
                    <p>📍 {match.location}</p>
                    
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
                        <input 
                            required 
                            placeholder="Ej: Club Leones" 
                            value={newMatch.rival}
                            onChange={e => setNewMatch({...newMatch, rival: e.target.value})} 
                        />
                    </div>
                    
                    {/* FECHA Y HORA SEPARADAS */}
                    <div style={{display:'flex', gap: 10}}>
                        <div className="form-group" style={{flex:1}}>
                            <label>Fecha:</label>
                            <input 
                                type="date" 
                                required 
                                value={newMatch.match_date}
                                onChange={e => setNewMatch({...newMatch, match_date: e.target.value})} 
                            />
                        </div>
                        <div className="form-group" style={{flex:1}}>
                            <label>Hora:</label>
                            <input 
                                type="time" 
                                required 
                                value={newMatch.match_time}
                                onChange={e => setNewMatch({...newMatch, match_time: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Lugar:</label>
                        <input 
                            required 
                            placeholder="Ej: Gimnasio Municipal" 
                            value={newMatch.location}
                            onChange={e => setNewMatch({...newMatch, location: e.target.value})} 
                        />
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
                <p style={{textAlign:'center', marginBottom: 20}}>Vs {editingMatch?.rival}</p>
                
                <form onSubmit={handleScoreSubmit} className="modal-form">
                    <div style={{display:'flex', gap: 20, justifyContent: 'center'}}>
                        <div className="form-group" style={{textAlign:'center'}}>
                            <label>Nosotros</label>
                            <input type="number" min="0" max="5" style={{width: 80, textAlign: 'center', fontSize: 20}} 
                                value={scoreData.score_local}
                                onChange={e => setScoreData({...scoreData, score_local: e.target.value})} 
                            />
                        </div>
                        <div className="form-group" style={{textAlign:'center'}}>
                            <label>Rival</label>
                            <input type="number" min="0" max="5" style={{width: 80, textAlign: 'center', fontSize: 20}}
                                value={scoreData.score_visit}
                                onChange={e => setScoreData({...scoreData, score_visit: e.target.value})} 
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