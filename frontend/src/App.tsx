import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage'; // Importe o DashboardPage
import './App.css'; 

function App() {
  return (
    <Router>
      {/* Removemos os links de navegação aqui, pois o protótipo os tem dentro das páginas */}
      <Routes>
        {/* // MUDAR A BARRA PARA HOME, DEPOIS DE IMPLEMENTAR! */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;