import React from 'react';
import { Link } from 'react-router-dom';
export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <div style={{display:'flex', gap:12}}>
        <Link to='/nova-nota'>Criar Notinha</Link>
        <Link to='/notas'>Ver Notinhas</Link>
      </div>
    </div>
  );
}

