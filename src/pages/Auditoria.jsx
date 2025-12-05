// src/pages/Auditoria.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./auditoria.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Auditoria() {
  const { token, user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchAudit();
    // eslint-disable-next-line
  }, [token]);

  async function fetchAudit() {
    try {
      const res = await axios.get(`${API}/audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      alert("Erro ao carregar auditoria");
    }
  }

  function applyFilters() {
    let data = [...logs];

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.action.toLowerCase().includes(s) ||
          (l.description || "").toLowerCase().includes(s) ||
          (l.username || "").toLowerCase().includes(s)
      );
    }

    if (actionFilter) {
      data = data.filter((l) => l.action === actionFilter);
    }

    if (userFilter) {
      data = data.filter((l) => String(l.username) === String(userFilter));
    }

    setFiltered(data);
  }

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [search, actionFilter, userFilter]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueUsers = [...new Set(logs.map((l) => l.username))];

  return (
    <div className="audit-root">
      <h1>Auditoria do Sistema</h1>

      {/* FILTROS */}
      <div className="audit-filters">
        <input
          placeholder="Buscar texto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">Todas ações</option>
          {uniqueActions.map((a, i) => (
            <option key={i} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">Todos usuários</option>
          {uniqueUsers.map((u, i) => (
            <option key={i} value={u}>
              {u || "Desconhecido"}
            </option>
          ))}
        </select>
      </div>

      {/* LISTA */}
      <div className="audit-list">
        {filtered.map((log) => (
          <div key={log.id} className="audit-row">
            <div>
              <b>Ação:</b> {log.action}
            </div>
            <div>
              <b>Usuário:</b> {log.username || "—"}
            </div>
            <div>
              <b>Descrição:</b> {log.description || "—"}
            </div>
            <div>
              <b>IP:</b> {log.ip_address || "—"}
            </div>
            <div>
              <b>Data:</b>{' '}
              {new Date(log.created_at).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
