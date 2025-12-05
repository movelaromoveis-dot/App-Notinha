import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import './novaNota.css';

const API = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:4000';

function blankItem() {
  return { supplier_name: '', description: '', qty: 1, unit_price: 0.0 };
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
  } catch (_) {
    return [];
  }
}

function setQueue(q) {
  localStorage.setItem('nf_pending_notes', JSON.stringify(q));
}

export default function NovaNota({ navigateAfterSave }) {
  const { user, token } = useContext(AuthContext);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [dataVenda, setDataVenda] = useState('');
  const [assignChecked, setAssignChecked] = useState(false);
  const [assignedSeller, setAssignedSeller] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [items, setItems] = useState([blankItem()]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    async function fetchSellers() {
      try {
        const res = await axios.get(`${API}/users?role=vendedor`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSellers(res.data || []);
      } catch (err) {
        console.warn('Não foi possível carregar vendedores (talvez offline)', err?.message);
      }
    }
    fetchSellers();

    const onOnline = () => { setIsOnline(true); syncPendingNotes(); };
    const onOffline = () => { setIsOnline(false); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (navigator.onLine) syncPendingNotes();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
    // eslint-disable-next-line
  }, []);

  function updateItem(index, field, value) {
    const copy = [...items];
    copy[index][field] = field === 'qty' ? Number(value) : (field === 'unit_price' ? Number(value) : value);
    setItems(copy);
  }
  function addItem() { setItems(prev => [...prev, blankItem()]); }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function calcTotal() {
    return items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.unit_price || 0)), 0).toFixed(2);
  }

  async function syncPendingNotes() {
    const pend = JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
    if (!pend || pend.length === 0) return;
    if (!navigator.onLine) return;
    setStatusMsg(`Sincronizando ${pend.length} nota(s)...`);
    const headers = { Authorization: `Bearer ${token}` };
    const still = [];
    for (const p of pend) {
      try {
        const payload = p.payload || p;
        await axios.post(`${API}/notes`, payload, { headers });
      } catch (err) {
        still.push(p);
      }
    }
    localStorage.setItem('nf_pending_notes', JSON.stringify(still));
    setStatusMsg(still.length === 0 ? 'Todas notas sincronizadas.' : `${still.length} notas ainda pendentes.`);
  }

  async function saveNote() {
    setLoading(true);
    setStatusMsg('');
    const payload = {
      store_id: user?.store_id || null,
      cliente_nome: clienteNome,
      cliente_endereco: clienteEndereco,
      cliente_telefone: clienteTelefone,
      data_compra: dataCompra,
      data_venda: dataVenda,
      assign_checked: !!assignChecked,
      assigned_seller: assignChecked ? assignedSeller : null,
      payment_method: paymentMethod,
      items: items.filter(it => it.description && (it.qty > 0))
    };
    if (!payload.cliente_nome) { setStatusMsg('Preencha o nome do cliente'); setLoading(false); return; }
    if (payload.items.length === 0) { setStatusMsg('Adicione ao menos 1 item'); setLoading(false); return; }

    if (!navigator.onLine) {
      const pend = JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
      pend.push({ id: `local-${Date.now()}`, created_at: new Date().toISOString(), payload, created_by: user?.username || 'local' });
      localStorage.setItem('nf_pending_notes', JSON.stringify(pend));
      setStatusMsg('Sem conexão — nota salva localmente e será sincronizada depois.');
      setLoading(false);
      resetForm();
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/notes`, payload, { headers });
      setStatusMsg('Nota salva com sucesso.');
      resetForm();
      if (typeof navigateAfterSave === 'function') navigateAfterSave();
    } catch (err) {
      setStatusMsg('Erro ao salvar no servidor — salvando localmente.');
      const pend = JSON.parse(localStorage.getItem('nf_pending_notes') || '[]');
      pend.push({ id: `local-${Date.now()}`, created_at: new Date().toISOString(), payload, created_by: user?.username || 'local' });
      localStorage.setItem('nf_pending_notes', JSON.stringify(pend));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setClienteNome('');
    setClienteEndereco('');
    setClienteTelefone('');
    setDataCompra('');
    setDataVenda('');
    setAssignChecked(false);
    setAssignedSeller('');
    setPaymentMethod('dinheiro');
    setItems([blankItem()]);
  }

  async function openPdfPreview(noteId, template = 'classic') {
    if (window.electron && window.electron.generatePdf) {
      try {
        const res = await axios.get(`${API}/notes/${noteId}`, { headers: { Authorization: `Bearer ${token}` } });
        const note = res.data;
        await window.electron.generatePdf({ note, template });
      } catch (err) {
        alert('Erro gerar PDF: ' + (err?.message || ''));
      }
    } else {
      alert('PDF não disponível neste ambiente');
    }
  }

  return (
    <div className="nova-nota-root">
      <h1 className="titulo">Criar Notinha</h1>

      <div className="card">
        <div className="card-title">Dados do Cliente</div>
        <input className="input" placeholder="Nome do cliente" value={clienteNome} onChange={e=>setClienteNome(e.target.value)} />
        <input className="input" placeholder="Endereço" value={clienteEndereco} onChange={e=>setClienteEndereco(e.target.value)} />
        <input className="input" placeholder="Telefone" value={clienteTelefone} onChange={e=>setClienteTelefone(e.target.value)} />
      </div>

      <div className="card small">
        <div className="card-title">Datas</div>
        <input className="input small" type="date" value={dataCompra} onChange={e=>setDataCompra(e.target.value)} />
        <input className="input small" type="date" value={dataVenda} onChange={e=>setDataVenda(e.target.value)} />
      </div>

      <div className="card small">
        <div className="card-title">Vendedor</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <label style={{fontSize:14}}>
            <input type="checkbox" checked={assignChecked} onChange={e=>setAssignChecked(e.target.checked)} /> Vender por outro vendedor?
          </label>
          {assignChecked && (
            <select className="input select" value={assignedSeller} onChange={e=>setAssignedSeller(e.target.value)}>
              <option value="">-- selecione --</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.full_name || s.username}</option>)}
            </select>
          )}
        </div>
        <div style={{marginTop:8, fontSize:12}}>Criado por: <b>{user?.full_name || user?.username}</b></div>
      </div>

      <div className="card small">
        <div className="card-title">Como o cliente vai pagar?</div>
        <div className="payment-line">
          <label><input type="radio" name="pay" checked={paymentMethod==='dinheiro'} onChange={()=>setPaymentMethod('dinheiro')} /> Dinheiro</label>
          <label><input type="radio" name="pay" checked={paymentMethod==='pix'} onChange={()=>setPaymentMethod('pix')} /> PIX</label>
          <label><input type="radio" name="pay" checked={paymentMethod==='credito'} onChange={()=>setPaymentMethod('credito')} /> Crédito</label>
          <label><input type="radio" name="pay" checked={paymentMethod==='debito'} onChange={()=>setPaymentMethod('debito')} /> Débito</label>
          <label><input type="radio" name="pay" checked={paymentMethod==='entrega'} onChange={()=>setPaymentMethod('entrega')} /> Entrega</label>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Itens</div>
        {items.map((it, idx) => (
          <div key={idx} className="item-row">
            <input className="input item-supplier" placeholder="Fornecedor" value={it.supplier_name} onChange={e=>updateItem(idx,'supplier_name',e.target.value)} />
            <input className="input item-desc" placeholder="Produto / descrição" value={it.description} onChange={e=>updateItem(idx,'description',e.target.value)} />
            <input className="input item-qty" type="number" min="0" value={it.qty} onChange={e=>updateItem(idx,'qty',e.target.value)} />
            <input className="input item-price" type="number" step="0.01" value={it.unit_price} onChange={e=>updateItem(idx,'unit_price',e.target.value)} />
            <button className="btn-remove" onClick={()=>removeItem(idx)}>Remover</button>
          </div>
        ))}
        <div style={{display:'flex', justifyContent:'center', marginTop:8}}>
          <button className="btn-large" onClick={addItem}>+ Adicionar item</button>
        </div>
      </div>

      <div className="card small">
        <div className="card-title">Resumo</div>
        <div style={{fontSize:18}}>Total: R$ <b>{calcTotal()}</b></div>
      </div>

      <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:10}}>
        <button className="btn-action" onClick={saveNote} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Nota'}</button>
        <button className="btn-secondary" onClick={resetForm}>Limpar</button>
      </div>

      <div style={{marginTop:12, textAlign:'center', color:'#444'}}>{statusMsg}</div>
    </div>
  );
}
