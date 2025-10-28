import React from 'react';
import { Link } from 'react-router-dom';

function DashboardPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Bem-vindo ao Dashboard!</h1>
      <p>Você acessou a área restrita.</p>
      <Link to="/login">Voltar ao Login</Link>
    </div>
  );
}

export default DashboardPage;