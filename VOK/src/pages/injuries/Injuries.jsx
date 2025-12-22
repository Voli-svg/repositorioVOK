import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth'; // Importamos seguridad
import './Injuries.css';

export default function Injuries() {
  const [injuries, setInjuries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTreatModal, setShowTreatModal] = useState(false);
  
  // Forms
  const [newReport, setNewReport] = useState({ title: '', description: '', severity: 'baja' });
  const [treatment, setTreatment] = useState({ id: null, diagnosis: '', status: 'tratamiento' });

  // 1. Cargar Usuario y Datos
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchInjuries();
  }, []);

  const fetchInjuries = () => {
    fetch('http://127.0.0.1:8000/api/injuries')
      .then(res => res.json())
      .then(data => setInjuries(data));
  };

  // 2. Jugador envía reporte (VERSIÓN SEGURA)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    // Verificamos que tengamos usuario
    if (!currentUser || !currentUser.id) {
        alert("Error: No estás identificado correctamente. Cierra sesión e ingresa de nuevo.");
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/injuries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newReport, user_id: currentUser.id })
        });

        // Verificamos si el servidor respondió bien
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Error al guardar en el servidor");
        }

        alert("¡Reporte enviado exitosamente!");
        setShowReportModal(false);
        setNewReport({ title: '', description: '', severity: 'baja' });
        fetchInjuries(); // Recargar lista

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo guardar la lesión. \n\nPosible causa: Tu usuario no existe en la base de datos o el servidor falló.");
    }
  };

  // 3. Kine envía tratamiento
  const handleTreatSubmit = async (e) => {
    e.preventDefault();
    await fetch(`http://127.0.0.1:8000/api/injuries/${treatment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        diagnosis: treatment.diagnosis, 
        status: treatment.status,
        treated_by: currentUser.id 
      })
    });
    setShowTreatModal(false);
    fetchInjuries();
  };

  const openTreatModal = (injury) => {
    setTreatment({ 
        id: injury.id, 
        diagnosis: injury.diagnosis || '', 
        status: injury.status 
    });
    setShowTreatModal(true);
  };

  // Helpers visuales
  const getSeverityBadge = (sev) => {
    const colors = { baja: '#facc15', media: '#f97316', alta: '#ef4444' }; // Amarillo, Naranja, Rojo
    return <span className="badge" style={{backgroundColor: colors[sev]}}>{sev.toUpperCase()}</span>;
  };

  const getStatusColor = (status) => {
    return status === 'pendiente' ? 'border-red' : (status === 'alta' ? 'border-green' : 'border-blue');
  };

  return (
    <div className="injuries-container">
      <div className="injuries-header">
        <h2>🏥 Enfermería y Fisioterapia</h2>
        
        {/* --- CÓDIGO TEMPORAL PARA VER MIS ROLES --- */}
        <div style={{background: '#fef3c7', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #f59e0b'}}>
           <small>
             <strong>Hola {currentUser?.full_name}. Tus roles detectados son: </strong> 
             {currentUser?.roles && currentUser.roles.length > 0 
                ? currentUser.roles.map(r => r.slug).join(', ') 
                : 'NINGUNO (Por eso no ves el botón)'}
           </small>
        </div>

        <button className="btn-report" onClick={() => setShowReportModal(true)}>
          + Reportar Molestia
        </button>
      </div>

      <div className="injuries-grid">
        {injuries.map(inj => (
          <div key={inj.id} className={`injury-card ${getStatusColor(inj.status)}`}>
            
            <div className="card-top">
                <span className="player-name">👤 {inj.player_name}</span>
                {getSeverityBadge(inj.severity)}
            </div>
            
            <h3 className="injury-title">{inj.title}</h3>
            <p className="injury-desc">"{inj.description}"</p>
            
            <div className="diagnosis-box">
                <h4>Diagnóstico / Tratamiento:</h4>
                {inj.diagnosis ? (
                    <p>{inj.diagnosis}</p>
                ) : (
                    <p style={{color: '#94a3b8', fontStyle: 'italic'}}>Esperando evaluación...</p>
                )}
                {inj.kine_name && <small className="kine-sign">Atendido por: {inj.kine_name}</small>}
            </div>

            {/* BOTÓN SOLO PARA KINES O COACHES */}
            {hasRole(currentUser, ['physio', 'kinesiologo', 'kine', 'coach', 'super_admin']) && (
                <button className="btn-treat" onClick={() => openTreatModal(inj)}>
                    🩺 Atender / Actualizar
                </button>
            )}
            
            <div className={`status-label status-${inj.status}`}>
                Estado: {inj.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL REPORTE (JUGADOR) --- */}
      {showReportModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h3>Reportar Dolor o Lesión</h3>
            
            <form onSubmit={handleReportSubmit} className="modal-form">
                {/* GRUPO 1: Título */}
                <div className="form-group">
                    <label htmlFor="title">Título Breve:</label>
                    <input 
                        id="title"
                        placeholder="Ej: Dolor Rodilla al saltar" 
                        value={newReport.title} 
                        onChange={e=>setNewReport({...newReport, title: e.target.value})} 
                        required 
                    />
                </div>

                {/* GRUPO 2: Descripción */}
                <div className="form-group">
                    <label htmlFor="description">Descripción Detallada:</label>
                    <textarea 
                        id="description"
                        placeholder="Describe qué sientes, dónde y cómo pasó..." 
                        value={newReport.description} 
                        onChange={e=>setNewReport({...newReport, description: e.target.value})} 
                        required 
                        rows="4"
                    />
                </div>

                {/* GRUPO 3: Severidad */}
                <div className="form-group">
                    <label htmlFor="severity">Nivel de Dolor:</label>
                    <select 
                        id="severity"
                        value={newReport.severity} 
                        onChange={e=>setNewReport({...newReport, severity: e.target.value})}
                    >
                        <option value="baja">Baja (Molestia leve)</option>
                        <option value="media">Media (Limita movimiento)</option>
                        <option value="alta">Alta (No puedo jugar)</option>
                    </select>
                </div>

                <div className="modal-actions">
                    <button type="button" className="modal-btn btn-cancel" onClick={()=>setShowReportModal(false)}>Cancelar</button>
                    <button type="submit" className="modal-btn btn-submit">Enviar Reporte</button>
                </div>
            </form>
            </div>
        </div>
      )}

      {/* --- MODAL TRATAMIENTO (KINE) - DISEÑO MEJORADO --- */}
      {showTreatModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🩺 Gestionar Tratamiento</h3>
            
            <form onSubmit={handleTreatSubmit} className="modal-form">
                
                {/* Campo de Diagnóstico */}
                <div className="form-group">
                    <label htmlFor="diagnosis">Diagnóstico y Tareas a realizar:</label>
                    <textarea 
                        id="diagnosis"
                        placeholder="Ej: Aplicar hielo 20min post-entreno, realizar ejercicios de manguito rotador..." 
                        value={treatment.diagnosis} 
                        onChange={e=>setTreatment({...treatment, diagnosis: e.target.value})} 
                        required 
                        rows="5"
                    />
                </div>

                {/* Campo de Estado */}
                <div className="form-group">
                    <label htmlFor="status">Actualizar Estado:</label>
                    <select 
                        id="status"
                        value={treatment.status} 
                        onChange={e=>setTreatment({...treatment, status: e.target.value})}
                        style={{cursor: 'pointer'}}
                    >
                        <option value="pendiente">⏳ Pendiente (Sin revisar)</option>
                        <option value="tratamiento">🩹 En Tratamiento (En recuperación)</option>
                        <option value="alta">✅ Dada de Alta (Listo para jugar)</option>
                    </select>
                </div>

                {/* Botones Modernos */}
                <div className="modal-actions">
                    <button type="button" className="modal-btn btn-cancel" onClick={()=>setShowTreatModal(false)}>
                        Cancelar
                    </button>
                    <button type="submit" className="modal-btn btn-submit">
                        Guardar Cambios
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}