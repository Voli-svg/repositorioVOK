import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth'; 
import './Inventory.css'; 

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estado para el Modal (Agregar/Editar)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, item_name: '', category: 'balones', quantity: 0, 
    condition_status: 'good', assigned_to: '', last_check_date: '' 
  });

  // 1. Cargar Usuario y Datos
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchItems();
  }, []);

  const fetchItems = () => {
    fetch('http://127.0.0.1:8000/api/inventory')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("Error cargando inventario:", err));
  };

  // --- TRADUCTOR DE ESTADOS (Aquí está la magia) ---
  const getStatusConfig = (status) => {
    // Normalizamos a minúsculas para evitar errores
    const s = status ? status.toLowerCase() : '';

    switch (s) {
        // Casos Buenos
        case 'new':
        case 'nuevo':
            return { label: '✨ Nuevo', bg: '#dcfce7', color: '#166534' }; // Verde brillante
        case 'good':
        case 'bueno':
            return { label: '✅ Bueno', bg: '#dcfce7', color: '#166534' }; // Verde normal
        
        // Casos Regulares
        case 'fair':
        case 'regular':
            return { label: '⚠️ Regular', bg: '#ffedd5', color: '#9a3412' }; // Naranja
        
        // Casos Malos
        case 'bad':
        case 'poor':
        case 'malo':
        case 'roto':
            return { label: '❌ Malo / Roto', bg: '#fee2e2', color: '#991b1b' }; // Rojo
        
        default:
            return { label: status, bg: '#f1f5f9', color: '#64748b' }; // Gris por defecto
    }
  };

  // 2. Manejar Guardado (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasRole(currentUser, ['coach', 'admin', 'super_admin'])) {
        alert("⛔ No tienes permisos para realizar esta acción.");
        return;
    }

    const url = formData.id 
        ? `http://127.0.0.1:8000/api/inventory/${formData.id}` 
        : 'http://127.0.0.1:8000/api/inventory'; 

    const method = formData.id ? 'PUT' : 'POST';

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    setShowModal(false);
    fetchItems(); 
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ítem?")) return;
    await fetch(`http://127.0.0.1:8000/api/inventory/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const openEdit = (item) => {
    setFormData(item);
    setShowModal(true);
  };

  const openCreate = () => {
    setFormData({ 
        id: null, item_name: '', category: 'balones', quantity: 1, 
        condition_status: 'good', assigned_to: '', last_check_date: new Date().toISOString().split('T')[0] 
    });
    setShowModal(true);
  };

  const canEdit = hasRole(currentUser, ['coach', 'admin', 'super_admin']);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2>📦 Inventario del Club</h2>
        
        {canEdit && (
            <button 
                onClick={openCreate}
                style={{
                    backgroundColor: '#3b82f6', color: 'white', border: 'none', 
                    padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                + Agregar Ítem
            </button>
        )}
      </div>

      <div className="table-responsive" style={{overflowX: 'auto'}}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Ítem</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Categoría</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Ubicación / Asignado</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => {
                    // Usamos el traductor aquí
                    const statusConfig = getStatusConfig(item.condition_status);
                    
                    return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '15px' }}><strong>{item.item_name}</strong></td>
                            <td style={{ padding: '15px' }}>{item.category}</td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>{item.quantity}</td>
                            
                            {/* CELDA DE ESTADO TRADUCIDA */}
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold',
                                    backgroundColor: statusConfig.bg,
                                    color: statusConfig.color
                                }}>
                                    {statusConfig.label}
                                </span>
                            </td>
                            
                            <td style={{ padding: '15px' }}>{item.assigned_to || '-'}</td>
                            
                            <td style={{ padding: '15px', textAlign: 'right' }}>
                                {canEdit ? (
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => openEdit(item)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}>✏️</button>
                                        <button onClick={() => handleDelete(item.id)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}>🗑️</button>
                                    </div>
                                ) : (
                                    <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }} title="Solo lectura">🔒</span>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{formData.id ? 'Editar Ítem' : 'Nuevo Ítem'}</h3>
            
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>Nombre del Ítem:</label>
                    <input required value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Categoría:</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="balones">Balones</option>
                            <option value="redes">Redes / Postes</option>
                            <option value="entrenamiento">Pesas / Conos</option>
                            <option value="medico">Botiquín</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ width: '80px' }}>
                        <label>Cant:</label>
                        <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Estado:</label>
                    {/* Guardamos valores en inglés o español, pero mostramos español */}
                    <select value={formData.condition_status} onChange={e => setFormData({...formData, condition_status: e.target.value})}>
                        <option value="new">✨ Nuevo</option>
                        <option value="good">✅ Bueno</option>
                        <option value="fair">⚠️ Regular</option>
                        <option value="bad">❌ Malo / Roto</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Ubicación / Asignado a:</label>
                    <input placeholder="Ej: Gimnasio A o Juan Pérez" value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} />
                </div>

                <div className="modal-actions">
                    <button type="button" className="modal-btn btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                    <button type="submit" className="modal-btn btn-submit">Guardar</button>
                </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}