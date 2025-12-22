import React, { useState, useEffect } from 'react';
import { hasRole } from '../../utils/auth';
import './Finances.css';

export default function Finances() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({ search: '', month: '' });
  const [showModal, setShowModal] = useState(false);
  
  const [newCharge, setNewCharge] = useState({
    user_id: '', amount: '', details: '', due_date: '' 
  });

  // 1. Cargar Usuario y Datos Iniciales
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
        setCurrentUser(JSON.parse(stored));
    }
    // Cargar usuarios (público o protegido según tu api.php, por si acaso enviamos token)
    fetch('http://127.0.0.1:8000/api/users').then(r => r.json()).then(setUsers);
  }, []);

  // 2. Cargar Pagos (CON TOKEN)
  useEffect(() => {
    if (!currentUser) return; // Esperamos a tener usuario

    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.month) params.append('month', filters.month);

    // OBTENEMOS EL TOKEN
    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:8000/api/payments?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- CLAVE: Enviamos el token
        }
    })
      .then(res => {
          if (res.status === 401) {
              alert("Tu sesión expiró. Por favor ingresa de nuevo.");
              // Opcional: Redirigir al login
              return [];
          }
          return res.json();
      })
      .then(data => {
          if(Array.isArray(data)) setPayments(data);
      })
      .catch(err => console.error("Error cargando pagos:", err));
  }, [filters, currentUser]); 

  const isAdmin = hasRole(currentUser, ['admin', 'coach', 'super_admin', 'finance']);

  // --- ACCIONES (CON TOKEN) ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCharge.user_id) { alert("Selecciona un jugador"); return; }

    const token = localStorage.getItem('token'); // Token fresco

    try {
        const response = await fetch('http://127.0.0.1:8000/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- CLAVE
            },
            body: JSON.stringify(newCharge)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Error al guardar");
        }

        alert("¡Cobro asignado correctamente!");
        setShowModal(false);
        setNewCharge({ user_id: '', amount: '', details: '', due_date: '' }); 
        setFilters({ ...filters }); // Recargar tabla

    } catch (error) {
        alert("Error: " + error.message);
    }
  };

  const toggleStatus = async (payment) => {
    if (!isAdmin) return;
    if (!window.confirm(`¿Cambiar estado de "${payment.details}"?`)) return;

    const token = localStorage.getItem('token');

    await fetch(`http://127.0.0.1:8000/api/payments/${payment.id}/pay`, { 
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- CLAVE
        }
    });
    
    // Actualización rápida visual
    setPayments(payments.map(p => 
        p.id === payment.id ? { ...p, status: p.status === 'pending' ? 'paid' : 'pending' } : p
    ));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  return (
    <div className="finances-container">
      <div className="finances-header">
        <h2>💰 {isAdmin ? 'Gestión Financiera' : 'Mis Pagos y Cuotas'}</h2>
        
        {isAdmin && (
            <button className="btn-add-charge" onClick={() => setShowModal(true)}>
                + Asignar Cuota
            </button>
        )}
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="filters-bar">
        {isAdmin && (
            <input 
                type="text" 
                placeholder="🔍 Buscar por nombre..." 
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                style={{flex: 2}}
            />
        )}
        <input 
            type="month" 
            value={filters.month}
            onChange={e => setFilters({...filters, month: e.target.value})}
            style={{flex: 1}}
        />
        <button onClick={() => setFilters({search:'', month:''})} className="btn-clear">
            Limpiar Filtros
        </button>
      </div>

      {/* --- TABLA --- */}
      <div className="table-responsive">
        <table className="finances-table">
            <thead>
                <tr>
                    {isAdmin && <th>Jugador</th>} 
                    <th>Concepto</th>
                    <th>Vencimiento</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    {isAdmin && <th>Acción</th>}
                </tr>
            </thead>
            <tbody>
                {payments.map(pay => (
                    <tr key={pay.id}>
                        {isAdmin && <td><strong>{pay.full_name}</strong></td>}
                        <td>{pay.details}</td>
                        <td>{pay.due_date}</td>
                        <td className="amount-cell">{formatCurrency(pay.amount)}</td>
                        <td>
                            <span className={`status-badge ${pay.status}`}>
                                {pay.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                            </span>
                        </td>
                        {isAdmin && (
                            <td>
                                <button 
                                    className={`btn-action ${pay.status === 'pending' ? 'btn-pay' : 'btn-undo'}`}
                                    onClick={() => toggleStatus(pay)}
                                >
                                    {pay.status === 'pending' ? '✅ Pagar' : '↩️ Deshacer'}
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                {payments.length === 0 && (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: 20}}>
                        {isAdmin ? 'No se encontraron cobros.' : 'No tienes cobros registrados.'}
                    </td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {showModal && isAdmin && (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Asignar Nuevo Cobro</h3>
                <form onSubmit={handleCreate} className="modal-form">
                    <div className="form-group">
                        <label>Jugador:</label>
                        <select required onChange={e => setNewCharge({...newCharge, user_id: e.target.value})}>
                            <option value="">Selecciona un jugador...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Concepto:</label>
                        <input required placeholder="Ej: Mensualidad Abril" value={newCharge.details} onChange={e => setNewCharge({...newCharge, details: e.target.value})} />
                    </div>

                    <div style={{display:'flex', gap: 10}}>
                        <div className="form-group" style={{flex:1}}>
                            <label>Monto:</label>
                            <input type="number" required placeholder="5000" onChange={e => setNewCharge({...newCharge, amount: e.target.value})} />
                        </div>
                        <div className="form-group" style={{flex:1}}>
                            <label>Vencimiento:</label>
                            <input type="date" required onChange={e => setNewCharge({...newCharge, due_date: e.target.value})} />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="modal-btn btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button type="submit" className="modal-btn btn-submit">Asignar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}