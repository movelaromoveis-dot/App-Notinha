import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import './notas.css';

const API = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:4000';

export default function Notas() {
  const { token, user } = useContext(AuthContext);
  const [notas, setNotas] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchNotas();
    loadPendentes();
    const onOnline = () => { syncPending(); fetchNotas(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line
  }, []);

  async function fetchNotas() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      setNotas(res.data || []);
      setMsg('');
    } catch (_err) {
      setMsg('Não foi possível acessar servidor. Mostrando notas locais.');
    } finally {
      setLoading(false);
    }
  }

  function loadPendentes() {
    const pend = JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
    setPendentes(pend);
  }

  async function syncPending() {
    const pend = JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
    if (!navigator.onLine || pend.length === 0) return;
    setMsg(`Sincronizando ${pend.length} nota(s)...`);
    const headers = { Authorization: `Bearer ${token}` };
    const still = [];
    for (const p of pend) {
      try {
        const payload = p.payload || p;
        await axios.post(`${API}/notes`, payload, { headers });
      } catch (_err) {
        still.push(p);
      }
    }
    localStorage.setItem('nf_pending_notes', JSON.stringify(still));
    loadPendentes();
    fetchNotas();
    setMsg(still.length === 0 ? 'Todas notas sincronizadas.' : `${still.length} pendentes ainda.`);
  }

  function handleDeletePending(id) {
    const pend = JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
    const filtered = pend.filter(p => p.id !== id);
    localStorage.setItem('nf_pending_notes', JSON.stringify(filtered));
    loadPendentes();
  }

  return (
    <div className="notas-root">
      <h1 className="titulo">Minhas Notinhas</h1>
      {msg && <div className="info">{msg}</div>}
      <div className="section">
        <h2 className="sub">Pendentes (offline)</h2>
        {pendentes.length === 0 && <div className="empty">Nenhuma nota pendente</div>}
        <div className="cards">
          {pendentes.map(p => (
            <div className="card-note pending" key={p.id}>
              <div className="card-row"><b>Cliente:</b> {p.payload.cliente_nome}</div>
              <div className="card-row"><b>Total:</b> R$ { (p.payload.items||[]).reduce((s,it)=>s+it.qty*it.unit_price,0).toFixed(2) }</div>
              <div className="card-row small">Criado localmente: {new Date(p.created_at).toLocaleString()}</div>
              <div className="card-actions">
                <button className="btn-small" onClick={()=>handleDeletePending(p.id)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="sub">Sincronizadas</h2>
        {loading && <div>Carregando...</div>}
        {!loading && notas.length === 0 && <div className="empty">Nenhuma nota disponível</div>}
        <div className="cards">
          {notas.map(n => (
            <div className="card-note" key={n.id}>
              <div className="card-row"><b>Nota #{n.id}</b></div>
              <div className="card-row"><b>Cliente:</b> {n.cliente_nome}</div>
              <div className="card-row"><b>Venda de:</b> {n.assigned_username || n.assigned_seller || '—'}</div>
              <div className="card-row"><b>Data:</b> {new Date(n.created_at).toLocaleDateString()}</div>
              <div className="card-row"><b>Total:</b> R$ {(n.total||0).toFixed(2)}</div>

              <div className="card-actions">
                <Link to={`/nota/${n.id}`} className="btn-small">Ver</Link>
                {(user && (user.role === 'admin' || user.role === 'gerente' || n.created_by === user.id || n.assigned_seller === user.id)) && (
                  <Link to={`/nota/${n.id}/editar`} className="btn-small">Editar</Link>
                )}
                <button className="btn-small" onClick={async ()=>{
                  if (window.electronApi && window.electronApi.generatePdf) {
                    try {
                      const res = await axios.get(`${API}/notes/${n.id}`, { headers: { Authorization: `Bearer ${token}` } });
                      await window.electronApi.generatePdf(res.data, 'classic');
                    } catch (err) {
                      alert('Erro gerar PDF: ' + (err?.message || ''));
                    }
                  } else if (window.electron && window.electron.generatePdf) {
                    try {
                      const res = await axios.get(`${API}/notes/${n.id}`, { headers: { Authorization: `Bearer ${token}` } });
                      await window.electron.generatePdf({ note: res.data, template: 'classic' });
                    } catch (err) {
                      alert('Erro gerar PDF: ' + (err?.message || ''));
                    }
                  } else {
                    alert('Impressão disponível somente no app desktop.');
                  }
                }}>PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
