import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import './styles/pages.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import About from './components/About';
import Contact from './components/Contact';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Help from './components/Help';
import AccessibilityTools from './components/AccessibilityTools';

function App() {
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  // Ao iniciar o aplicativo, pega o token do localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken); // Atualiza o estado se o token estiver no localStorage
    }
  }, []);

  useEffect(() => {
    // Se não houver token e a página não for de login ou registrar, redireciona
    if (!token && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
      navigate("/login"); // Redireciona para o login se não houver token
    }
  }, [token, navigate]);

  return (
    <div className="container">
      <AccessibilityTools />

      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <Link className="navbar-brand" to="/">Investimentos</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item"><Link className="nav-link" to="/about">Sobre</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/contact">Contato</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/help">Ajuda</Link></li>
            {!token ? (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/register">Registrar</Link></li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/profile">Perfil</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/settings">Configurações</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Bem-vindo à Plataforma de Investimentos Inteligentes</h1>} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard token={token} />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Help />} />
        <Route path="/profile" element={<Profile token={token} />} />
        <Route path="/settings" element={<Settings token={token} />} />
      </Routes>
    </div>
  );
}

export default App;
