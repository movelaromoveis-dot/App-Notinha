// src/pages/CriarUsuario.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './usuarios.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function CriarUsuario() {
  const { token, user } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState([]);
  const navigate = useNavigate();

  useEffect(()=> {
    async function loadStores() {
      try {
        const res = await axios.get(`${API}/stores`, { headers: { Authorization: `Bearer ${token}` } });
        setStores(res.data || []);
      } catch (err) { console.warn(err); }
    }
    loadStores();
    // eslint-disable-next-line
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!username || !password) return alert('username e senha obrigatórios');
    try {
      await axios.post(`${API}/users`, { username, password, full_name: fullName, role_name: role, store_id: storeId || null }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Usuário criado');
      navigate('/usuarios');
    } catch (err) {
      alert('Erro criar usuário: ' + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div className="usuarios-root">
      <h1>Criar Usuário</h1>
      <form onSubmit={handleCreate} className="card">
        <label>Nome completo</label>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} />
        <label>Usuário (login)</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} />
        <label>Senha inicial</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label>Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="vendedor">Vendedor</option>
          <option value="gerente">Gerente</option>
          <option value="admin">Admin</option>
        </select>
        <label>Loja</label>
        <select value={storeId} onChange={e=>setStoreId(e.target.value)}>
          <option value="">-- sem loja --</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{marginTop:10}}>
          <button className="btn-action" type="submit">Criar Usuário</button>
          <button className="btn-secondary" type="button" onClick={()=>navigate('/usuarios')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
