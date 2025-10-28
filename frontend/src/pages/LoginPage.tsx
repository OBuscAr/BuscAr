

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importe useNavigate para redirecionar após o login
import { mockLogin } from '../services/auth'; // Importe o mock de login
import type { LoginCredentials } from '../services/auth';
import BuscArLogo from '../assets/bus_leaf_icon.png'; // o logo aqui

function LoginPage() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    senha: '',
  });
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false); // Estado para controlar o loading do botão
  const navigate = useNavigate(); // Hook para navegação programática

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleKeepLoggedInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeepLoggedIn(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setLoading(true); // Ativa o estado de loading

    if (!formData.email || !formData.senha) {
      setMensagem('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      // Chama o serviço de mock de login
      const response = await mockLogin(formData);

      if (response && response.token) {
        setMensagem('Login realizado com sucesso!');
        // Em um cenário real, salva o token aqui
        // Ex: localStorage.setItem('authToken', response.token);
        // E redirecionaria para o dashboard
        navigate('/dashboard'); // Redireciona para o dashboard
      } else {
        setMensagem('E-mail ou senha inválidos.');
      }
    } catch (error) {
      setMensagem('Ocorreu um erro ao tentar fazer login.');
      console.error('Erro de login:', error);
    } finally {
      setLoading(false); // Desativa o estado de loading
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-section">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Insira seu email e senha para fazer o login!</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha*</label>
            <div className="password-input-wrapper">
              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Mín. 8 caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
              />
              {/* O ícone de "olho" para mostrar/esconder senha pode ser adicionado aqui */}
            </div>
            <Link to="/cadastro" className="forgot-password-link">Esqueceu a senha?</Link>
          </div>
          
          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="keepLoggedIn"
              checked={keepLoggedIn}
              onChange={handleKeepLoggedInChange}
            />
            <label htmlFor="keepLoggedIn">Me mantenha conectado(a)</label>
          </div>

          {mensagem && <p className={`mensagem ${mensagem.includes('sucesso') ? 'success' : 'error'}`}>{mensagem}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer-text">
          <Link to="/cadastro" className="secondary-link">Criar conta</Link>
        </p>
      </div>

      <div className="auth-logo-section">
        {/*ícone para o logo ou uma imagem */}
        <img src={BuscArLogo} alt="BuscAr Logo" className="bus_logo_icon" />
        <h2 className="logo-text">BuscAr</h2>
      </div>
    </div>
  );
}

export default LoginPage;