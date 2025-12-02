import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiChevronDown } from 'react-icons/fi';
import '../style/Header.css';

const Header = () => {
  const [userName, setUserName] = useState('Usuário');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Pega o nome do usuário salvo no localStorage durante o login
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    // Fecha o dropdown ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Limpa os dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Redireciona para a landing page
    navigate('/');
  };

  return (
    <header className="dashboard-header">
      <div className="header-title">
        <h2>Olá, {userName}!</h2>
        <p>Como está seu ar hoje?</p>
      </div>
      <div className="header-profile" ref={dropdownRef}>
        <div 
          className="profile-info"
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar">
            <span>{userName.substring(0, 1).toUpperCase()}</span>
          </div>
          <div className="username">{userName}</div>
          <FiChevronDown style={{ marginLeft: '0.5rem', fontSize: '16px' }} />
        </div>
        
        {showDropdown && (
          <div className="user-dropdown">
            <button onClick={handleLogout} className="dropdown-item logout-btn">
              <FiLogOut />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;