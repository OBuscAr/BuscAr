
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importe useNavigate
// import { mockRegister } from '../services/auth'; // Importe o mock de registro
import type { RegisterData } from '../services/auth'; // Importe o tipo correto
import BuscArLogo from '../assets/bus_leaf_icon.png'; // logo
import axios from 'axios';
import '../style/AuthPages.css'; // Estilos para páginas de autenticação

function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData & { confirmarSenha: string }>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setLoading(true);

    // validações
    if (!formData.nome || !formData.email || !formData.senha || !formData.confirmarSenha) {
      setMensagem('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setMensagem('As senhas não coincidem!');
      setLoading(false);
      return;
    }
    if (formData.senha.length < 8) {
      setMensagem('A senha deve ter pelo menos 8 caracteres.');
      setLoading(false);
      return;
    }
    // --- FIM DAS VALIDAÇÕES ---

    try {
      // Define a URL da API
      const API_URL = 'http://localhost:8000/users/';

      // Prepara os dados conforme BACKEND
      const dadosParaEnviar = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
      };

      // Faz a requisição POST real
      const response = await axios.post(API_URL, dadosParaEnviar);

      // Lida com o SUCESSO
      console.log('Usuário criado:', response.data);
      setMensagem('Cadastro realizado com sucesso!');

      // Limpa o formulário
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
      });

      // Redireciona para o login
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      // Lida com os ERROS (FastAPI retorna validações em data.detail como array)
      if (axios.isAxiosError(error) && error.response) {
        const data: any = error.response.data;
        let erroMsg = 'Ocorreu um erro no cadastro.';

        if (data) {
          if (typeof data.detail === 'string') {
            erroMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            erroMsg = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(' ');
          } else if (data.detail && typeof data.detail === 'object') {
            erroMsg = data.detail.message || JSON.stringify(data.detail);
          }
        }

        setMensagem(erroMsg);
      } else {
        setMensagem('Não foi possível conectar ao servidor. Tente novamente.');
      }
      console.error('Erro no cadastro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-section">
        <h1 className="auth-title">Criar Conta</h1>
        {/* <p className="auth-subtitle">Preencha os campos abaixo para criar sua conta.</p> */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome*</label>
            <input
              type="text"
              id="nome"
              name="nome"
              placeholder="Digite seu nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
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
                placeholder="8+ caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Senha*</label>
            <div className="password-input-wrapper">
              <input
                type="password"
                id="confirmarSenha"
                name="confirmarSenha"
                placeholder="Confirme sua senha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <p className="terms-text">
            Ao se inscrever, você concorda com os termos e condições.{' '}
            {/* <Link to="/termos" className="inline-link">termos e condições</Link>. */}
          </p>

          {mensagem && <p className={`mensagem ${mensagem.includes('sucesso') ? 'success' : 'error'}`}>{mensagem}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="auth-footer-text">
          Já tem uma conta? <Link to="/login" className="secondary-link">Login</Link>
        </p>
      </div>

      {/* Seção do Logo - Idêntica à LoginPage */}
      <div className="auth-logo-section">
        <img src={BuscArLogo} alt="BuscAr Logo" className="bus_logo_icon" />
        <h2 className="logo-text">BuscAr</h2>
      </div>
    </div>
  );
}

export default RegisterPage;