// src/pages/EditarUsuario.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './usuarios.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function EditarUsuario() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [stores, setStores] = useState([]);
  const navigate = useNavigate();

  useEffect(()=> {
    async function load() {
      try {
        const r = await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
        // find specific user (we didn't build GET /users/:id; reuse list)
        const u = r.data.find(x => String(x.id) === String(id));
        setData(u || null);
      } catch (err) {
        alert('Erro carregar usuário');
      }
    }
    async function loadStores() {
      try {
        const res = await axios.get(`${API}/stores`, { headers: { Authorization: `Bearer ${token}` } });
        setStores(res.data || []);
      } catch (err) {}
    }
    load();
    loadStores();
    // eslint-disable-next-line
  }, [id]);

  if (!data) return <div>Carregando...</div>;

  async function save() {
    try {
      // role change: only admin can set admin
      await axios.put(`${API}/users/${id}`, { full_name: data.full_name, role_name: data.role_name, store_id: data.store_id, active: data.active }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Atualizado');
      navigate('/usuarios');
    } catch (err) {
      alert('Erro salvar: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function resetPass() {
    const novo = prompt('Nova senha temporária:');
    if (!novo) return;
    try {
      await axios.patch(`${API}/users/${id}/password`, { new_password: novo }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Senha resetada. Usuário deverá trocar no primeiro login.');
    } catch (err) {
      alert('Erro resetar senha');
    }
  }

  return (
    <div className="usuarios-root">
      <h1>Editar Usuário</h1>
      <div className="card">
        <label>Nome completo</label>
        <input value={data.full_name} onChange={e=>setData({...data, full_name: e.target.value})} />
        <label>Role</label>
        <select value={data.role_name} onChange={e=>setData({...data, role_name: e.target.value})}>
          <option value="vendedor">Vendedor</option>
          <option value="gerente">Gerente</option>
          <option value="admin">Admin</option>
        </select>
        <label>Loja</label>
        <select value={data.store_id || ''} onChange={e=>setData({...data, store_id: e.target.value})}>
          <option value="">-- sem loja --</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label>Ativo</label>
        <div><label><input type="checkbox" checked={!!data.active} onChange={e=>setData({...data, active: e.target.checked})} /> Ativo</label></div>

        <div style={{marginTop:12}}>
          <button className="btn-action" onClick={save}>Salvar</button>
          <button className="btn-secondary" onClick={()=>navigate('/usuarios')}>Cancelar</button>
          <button className="btn-small" onClick={resetPass} style={{marginLeft:8}}>Resetar senha</button>
        </div>
      </div>
    </div>
  );
}
