import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(username, password);
      if (data.user.must_change_password) {
        navigate('/trocar-senha');
      } else {
        navigate('/home');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth:400, margin:'60px auto', padding:20, border:'1px solid #ddd', borderRadius:6}}>
      <h2>Entrar — Notafacil</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuário</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div style={{marginTop:10}}>
          <label>Senha</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button style={{marginTop:12}} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  );
}
