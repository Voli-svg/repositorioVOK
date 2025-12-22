import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [nextMatch, setNextMatch] = useState(null);
  
  // AHORA EL ESTADO GUARDA DOS MONTOS: VENCIDO Y FUTURO
  const [financialStatus, setFinancialStatus] = useState({ 
      status: 'loading', 
      expiredAmount: 0, 
      upcomingAmount: 0 
  });
  
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // --- 1. CARGA INICIAL ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    fetch('http://127.0.0.1:8000/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (!storedUser && data.length > 0) setCurrentUser(data[0]);
      });

    fetchPosts();
    fetchNextMatch();
  }, []);

  // --- 2. FINANZAS (LÓGICA CORREGIDA: VENCIDO VS FUTURO) ---
  useEffect(() => {
    if (!currentUser) return; 
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    // Reset status
    setFinancialStatus(prev => ({ ...prev, status: 'loading' }));

    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:8000/api/payments/user/${currentUser.id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
      .then(res => {
        if (!res.ok) throw new Error("Error API");
        return res.json();
      })
      .then(data => {
        // --- AQUÍ ESTÁ LA MAGIA ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Quitamos la hora para comparar solo fechas

        let expired = 0;
        let upcoming = 0;

        data.forEach(p => {
            if (p.status === 'pending') {
                // Truco: Agregamos T00:00:00 para asegurar que lea la fecha local correctamente
                const dueDate = new Date(p.due_date + "T00:00:00");
                
                if (dueDate < today) {
                    // Si la fecha ya pasó -> ES DEUDA REAL
                    expired += parseFloat(p.amount);
                } else {
                    // Si la fecha es hoy o futuro -> ES CUOTA POR PAGAR (No alerta roja)
                    upcoming += parseFloat(p.amount);
                }
            }
        });
        
        // Determinamos el color del estado
        let finalStatus = 'ok';
        if (expired > 0) finalStatus = 'expired';       // Rojo
        else if (upcoming > 0) finalStatus = 'upcoming'; // Azul/Amarillo

        setFinancialStatus({
            status: finalStatus,
            expiredAmount: expired,
            upcomingAmount: upcoming
        });
      })
      .catch(err => {
        console.error("Error finanzas:", err);
        setFinancialStatus({ status: 'error', expiredAmount: 0, upcomingAmount: 0 });
      });
  }, [currentUser]);

  // --- FUNCIONES AUXILIARES ---
  const fetchPosts = () => {
    fetch('http://127.0.0.1:8000/api/posts').then(r=>r.json()).then(setPosts);
  };

  const fetchNextMatch = () => {
    fetch('http://127.0.0.1:8000/api/matches')
      .then(r=>r.json())
      .then(data => {
        const upcoming = data
            .filter(m => m.status === 'upcoming') 
            .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
        if (upcoming.length > 0) setNextMatch(upcoming[0]);
      });
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !currentUser) return;
    const token = localStorage.getItem('token');
    await fetch('http://127.0.0.1:8000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ user_id: currentUser.id, content: newPost })
    });
    setNewPost('');
    fetchPosts();
  };

  const handleLike = async (id) => {
     const token = localStorage.getItem('token');
     setPosts(posts.map(p => p.id === id ? { ...p, likes_count: p.likes_count + 1 } : p));
     await fetch(`http://127.0.0.1:8000/api/posts/${id}/like`, { 
         method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } 
     });
  };

  const formatDate = (dateStr) => {
    if(!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  return (
    <div className="dashboard-container">
        
        <div className="debug-bar" style={{background: '#333', color: 'white', padding: '5px 10px', textAlign: 'right'}}>
            <small>👤 Simulando a: </small>
            <select 
                value={currentUser?.id || ''} 
                onChange={(e) => setCurrentUser(users.find(u => u.id == e.target.value))}
                style={{marginLeft: 10}}
            >
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
        </div>

        <div className="dashboard-grid">
            
            {/* MURO */}
            <main className="main-feed">
                <h2 className="section-title">📢 Muro del Equipo</h2>
                <div className="compose-card">
                    <form onSubmit={handlePostSubmit}>
                        <input type="text" placeholder={`¿Qué cuentas, ${currentUser?.full_name?.split(' ')[0]}?`} value={newPost} onChange={e => setNewPost(e.target.value)} />
                    </form>
                </div>
                <div className="feed-list">
                    {posts.map(post => (
                        <div key={post.id} className="feed-card">
                            <div className="feed-header">
                                <div className="avatar-circle">{post.full_name.charAt(0)}</div>
                                <div className="feed-meta">
                                    <span className="user-name">{post.full_name}</span>
                                    <span className="post-time">{formatDate(post.created_at)}</span>
                                </div>
                            </div>
                            <div className="feed-body">{post.content}</div>
                            <div className="feed-actions">
                                <button className="btn-action" onClick={() => handleLike(post.id)}>❤️ {post.likes_count}</button>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && <p style={{textAlign:'center', color:'#999'}}>No hay publicaciones.</p>}
                </div>
            </main>

            {/* WIDGETS */}
            <aside className="sidebar-widgets">
                <div className="widget-card">
                    <div className="widget-header"><h3>🏐 Próximo Partido</h3></div>
                    <div className="widget-body">
                        {nextMatch ? (
                            <>
                                <div className="match-detail"><label>🆚 Rival:</label> <strong>{nextMatch.opponent}</strong></div>
                                <div className="match-detail"><label>📅 Cuándo:</label> <span>{formatDate(nextMatch.match_date)}</span></div>
                                <div className="match-detail"><label>📍 Lugar:</label> <span>{nextMatch.location}</span></div>
                            </>
                        ) : <p className="empty-state">No hay partidos.</p>}
                    </div>
                </div>

                {/* --- WIDGET FINANZAS INTELIGENTE --- */}
                <div className="widget-card">
                    <div className="widget-header"><h3>💰 Estado de Cuenta</h3></div>
                    <div className="widget-body text-center">
                        
                        {financialStatus.status === 'loading' && <p style={{color: '#94a3b8'}}>Consultando...</p>}
                        
                        {financialStatus.status === 'error' && (
                             <div className="status-box" style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2'}}>
                                ❌ Error de conexión
                             </div>
                        )}

                        {/* CASO 1: TIENE DEUDA VENCIDA (ROJO) */}
                        {financialStatus.status === 'expired' && (
                            <div className="status-box status-red">
                                <span style={{fontSize:'2rem', display:'block'}}>⚠️</span>
                                Tienes deuda vencida:<br/>
                                <strong>${financialStatus.expiredAmount.toLocaleString('es-CL')}</strong>
                                {financialStatus.upcomingAmount > 0 && (
                                    <div style={{fontSize: '0.8rem', marginTop: 5, color: '#b91c1c'}}>
                                        (+ ${financialStatus.upcomingAmount.toLocaleString('es-CL')} por vencer)
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CASO 2: NO TIENE VENCIDA, PERO SÍ FUTURA (AZUL) */}
                        {financialStatus.status === 'upcoming' && (
                            <div className="status-box" style={{background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe'}}>
                                <span style={{fontSize:'2rem', display:'block'}}>📅</span>
                                Estás al día ✅<br/>
                                <small>Próximo vencimiento:</small><br/>
                                <strong>${financialStatus.upcomingAmount.toLocaleString('es-CL')}</strong>
                            </div>
                        )}

                        {/* CASO 3: LIMPIO TOTAL (VERDE) */}
                        {financialStatus.status === 'ok' && (
                            <div className="status-box status-green">
                                <span style={{fontSize:'2rem', display:'block'}}>✅</span>
                                ¡Todo Pagado!<br/>
                                <small>No tienes cobros pendientes</small>
                            </div>
                        )}
                        
                    </div>
                </div>
            </aside>
        </div>
    </div>
  );
}