
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importe useNavigate
import { mockRegister } from '../services/auth'; // Importe o mock de registro
import type { RegisterData } from '../services/auth'; // Importe o tipo correto
import BuscArLogo from '../assets/bus_leaf_icon.png'; // Use o mesmo logo

function RegisterPage() {
  // Ajuste no estado para incluir 'username' e 'confirmarSenha'
  const [formData, setFormData] = useState<RegisterData & { confirmarSenha: string }>({
    nome: '',
    email: '',
    username: '', // Adicionado
    senha: '',
    confirmarSenha: '', // Adicionado
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

    // Validação de campos vazios (poderia ser mais robusta)
    if (!formData.nome || !formData.email || !formData.username || !formData.senha || !formData.confirmarSenha) {
      setMensagem('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    // Validação de senhas
    if (formData.senha !== formData.confirmarSenha) {
      setMensagem('As senhas não coincidem!');
      setLoading(false);
      return;
    }

    // Validar comprimento mínimo da senha (exemplo)
    if (formData.senha.length < 6) {
      setMensagem('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // Prepara os dados para enviar (excluindo confirmarSenha)
      const dataToSend: RegisterData = {
        nome: formData.nome,
        email: formData.email,
        username: formData.username,
        senha: formData.senha,
      };

      // Chama o serviço de mock de registro
      const response = await mockRegister(dataToSend);

      if (response && response.message) {
        setMensagem(response.message);
        // Opcional: Redirecionar para o login após alguns segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000); // Redireciona após 2 segundos
      } else {
        setMensagem('Erro ao tentar registrar. Tente novamente.');
      }
    } catch (error) {
      setMensagem('Ocorreu um erro inesperado durante o registro.');
      console.error('Erro de registro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-section">
        <h1 className="auth-title">Criar Conta</h1>
        {/* Subtítulo opcional, se quiser adicionar */}
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
            <label htmlFor="username">Username*</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              value={formData.username}
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
                placeholder="6+ caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
                minLength={6}
              />
              {/* Ícone de olho pode ser adicionado aqui */}
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