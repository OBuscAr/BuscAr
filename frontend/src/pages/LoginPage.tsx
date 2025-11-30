import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importe useNavigate para redirecionar após o login
//import { mockLogin } from '../services/auth'; // Importe o mock de login
import type { LoginCredentials } from '../services/auth';
import BuscArLogo from '../assets/bus_leaf_icon.png'; // o logo
import axios from 'axios';
import '../style/AuthPages.css'; // Estilos para páginas de autenticação

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
    setLoading(true);

    try {
      // OAuth2 espera 'username' e 'password' como form data
      const formDataToSend = new URLSearchParams();
      formDataToSend.append('username', formData.email);  // Usar formData.email
      formDataToSend.append('password', formData.senha);   // Usar formData.senha

      const response = await axios.post('http://localhost:8000/login/', formDataToSend, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, token_type, nome, email } = response.data;
      
      // Armazena o token e dados do usuário no localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_type', token_type);
      localStorage.setItem('userName', nome);
      localStorage.setItem('userEmail', email);

      // Redireciona para o painel
      navigate('/painel');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setMensagem('Email ou senha incorretos.');
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          setMensagem(detail);
        } else if (Array.isArray(detail)) {
          const mensagens = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          setMensagem(mensagens);
        } else {
          setMensagem('Erro ao fazer login.');
        }
      } else {
        setMensagem('Erro no servidor. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
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
              placeholder="nome@gmail.com"
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
              {}
            </div>
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
        {/*logo*/}
        <img src={BuscArLogo} alt="BuscAr Logo" className="bus_logo_icon" />
        <h2 className="logo-text">BuscAr</h2>
      </div>
    </div>
  );
}

export default LoginPage;