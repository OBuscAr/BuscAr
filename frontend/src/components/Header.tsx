import { useState, useEffect } from 'react';
import { BsBellFill, BsPersonCircle } from 'react-icons/bs';
import '../style/Dashboard.css';

const Header = () => {
  const [userName, setUserName] = useState('Usuário(a)');

  useEffect(() => {
    // Pega o nome do usuário salvo no localStorage durante o login
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  return (
    <header className="dashboard-header">
      <div className="header-title">
        <h2>Olá, {userName}!</h2>
        <p>Como está seu ar hoje?</p>
      </div>
      <div className="header-profile">
        <BsBellFill />
        <div className="profile-info">
          <div className="avatar">
            {/* <BsPersonCircle />  */}
            {/* Usando iniciais como no protótipo */}
            {userName.substring(0, 1)}
          </div>
          <div className="username">{userName}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;