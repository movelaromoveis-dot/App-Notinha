// src/pages/Usuarios.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './usuarios.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Usuarios() {
  const { token, user } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    fetchUsers();
    fetchStores();
    // eslint-disable-next-line
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsuarios(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Erro carregar usuários');
    } finally { setLoading(false); }
  }

  async function fetchStores() {
    try {
      const res = await axios.get(`${API}/stores`, { headers: { Authorization: `Bearer ${token}` } });
      setStores(res.data || []);
    } catch (err) {
      console.warn('Não foi possível carregar lojas', err?.message);
    }
  }

  async function toggleActive(u) {
    if (!confirm(`Deseja ${u.active ? 'desativar' : 'ativar'} o usuário ${u.full_name || u.username}?`)) return;
    try {
      await axios.patch(`${API}/users/${u.id}/activate`, { active: !u.active }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) {
      alert('Erro alterar status');
    }
  }

  return (
    <div className="usuarios-root">
      <h1>Usuários</h1>
      <div style={{marginBottom:10}}>
        {(user && (user.role === 'admin' || user.role === 'gerente')) && <Link to="/usuarios/novo" className="btn-action">Criar Usuário</Link>}
      </div>

      <div className="cards">
        {usuarios.map(u => (
          <div key={u.id} className="card-user">
            <div className="card-title">{u.full_name || u.username}</div>
            <div className="card-row">Usuário: {u.username}</div>
            <div className="card-row">Role: {u.role_name}</div>
            <div className="card-row">Loja: {u.store_id || '—'}</div>
            <div className="card-row">Ativo: {u.active ? 'Sim' : 'Não'}</div>

            <div className="card-actions">
              <Link to={`/usuarios/${u.id}/editar`} className="btn-small">Editar</Link>
              <button className="btn-small" onClick={()=>toggleActive(u)}>{u.active ? 'Desativar' : 'Ativar'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
