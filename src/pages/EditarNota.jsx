import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import './notas.css';

const API = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:4000';

export default function EditarNota() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [nota, setNota] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API}/notes/${id}`, { headers: { Authorization: `Bearer ${token} ` } });
        setNota(res.data);
      } catch (err) {
        alert('Erro carregar nota');
      } finally { setLoading(false); }
    }
    load();
    // eslint-disable-next-line
  }, [id]);

  async function handleSave() {
    try {
      const payload = {
        cliente_nome: nota.cliente_nome,
        cliente_endereco: nota.cliente_endereco,
        cliente_telefone: nota.cliente_telefone,
        data_compra: nota.data_compra,
        data_venda: nota.data_venda,
        assign_checked: true,
        assigned_seller: nota.assigned_seller,
        payment_method: nota.payment_method,
        items: (nota.items || []).map(it => ({ description: it.product_name, supplier_name: it.supplier_name, qty: it.qty, unit_price: it.unit_price }))
      };
      await axios.put(`${API}/notes/${id}`, payload, { headers: { Authorization: `Bearer ${token} ` } });
      alert('Nota atualizada');
      navigate(`/nota/${id}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (!nota) return <div>Nota não encontrada</div>;

  return (
    <div className="editar-root">
      <h1>Editar Nota #{nota.id}</h1>
      <div className="card">
        <label>Cliente</label>
        <input value={nota.cliente_nome} onChange={e => setNota({ ...nota, cliente_nome: e.target.value })} />
        <label>Endereço</label>
        <input value={nota.cliente_endereco} onChange={e => setNota({ ...nota, cliente_endereco: e.target.value })} />
        <label>Telefone</label>
        <input value={nota.cliente_telefone} onChange={e => setNota({ ...nota, cliente_telefone: e.target.value })} />
        <label>Forma de pagamento</label>
        <select value={nota.payment_method} onChange={e => setNota({ ...nota, payment_method: e.target.value })}>
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="credito">Crédito</option>
          <option value="debito">Débito</option>
          <option value="entrega">Entrega</option>
        </select>
      </div>

      <div className="card">
        <h3>Itens</h3>
        {(nota.items || []).map((it, idx) => (
          <div key={idx} className="item-edit">
            <input value={it.product_name} onChange={e => {
              const copy = [...nota.items]; copy[idx].product_name = e.target.value; setNota({ ...nota, items: copy });
            }} />
            <input type="number" value={it.qty} onChange={e => {
              const copy = [...nota.items]; copy[idx].qty = Number(e.target.value); setNota({ ...nota, items: copy });
            }} />
            <input type="number" value={it.unit_price} onChange={e => {
              const copy = [...nota.items]; copy[idx].unit_price = Number(e.target.value); setNota({ ...nota, items: copy });
            }} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn-action" onClick={handleSave}>Salvar</button>
        <button className="btn-secondary" onClick={() => navigate(`/nota/${id}`)}>Cancelar</button>
      </div>
    </div>
  );
}
