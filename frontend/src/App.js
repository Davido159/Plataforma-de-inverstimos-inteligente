import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import './App.css'; 
import './styles/pages.css'; 

// Component Imports
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import About from './components/About';
import Contact from './components/Contact';
import Profile from './components/Profile';
import Help from './components/Help';
import AccessibilityTools from './components/AccessibilityTools';
import News from './components/News';
import FinancialManagementPage from './components/finance/FinancialManagementPage';
import InvestmentsPage from './pages/InvestmentsPage';
import AssetDetailsPage from './pages/AssetDetailsPage';
import MyPortfolioPage from './pages/MyPortfolioPage';
import InvestmentSimulator from './components/investment/InvestmentSimulator';
import EducationPage from './pages/EducationPage';

const isPublicPath = (path) => {
  const publicPaths = ['/login', '/register', '/about', '/contact', '/help'];
  return publicPaths.includes(path);
};

const ProtectedRoute = ({ token, currentUser, loadingProfile, children }) => {
  const location = useLocation();

  if (token && loadingProfile) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }
  if (!token) { 
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (token && !loadingProfile && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function AppInner() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchUserProfile = useCallback(async (currentToken) => {
    if (!currentToken) {
      setCurrentUser(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const response = await axios.get(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('App.js: Erro ao buscar perfil do usuário:', error.response?.data?.message || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setToken(null);
      }
      setCurrentUser(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (token) {
        fetchUserProfile(token);
    } else {
        setCurrentUser(null);
        setLoadingProfile(false);
    }
  }, [token, fetchUserProfile]);

  useEffect(() => {
    const currentPath = location.pathname;
    if (!loadingProfile && !token && !isPublicPath(currentPath) && currentPath !== '/') {
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [location, token, loadingProfile, navigate]);


  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setLoadingProfile(true); 
    setToken(newToken); 
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setLoadingProfile(false);
    navigate('/login');
  };

  const showSidebar = token && currentUser && !loadingProfile && !isPublicPath(location.pathname) && !['/login', '/register'].includes(location.pathname);

  if (token && loadingProfile) {
      return (
          <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status" style={{width: "3rem", height: "3rem"}}>
              <span className="visually-hidden">Carregando plataforma...</span>
            </div>
          </div>
      );
  }

  const mainToolsMenuItems = [
    { path: "/dashboard", icon: "tachometer-alt", label: "Dashboard" },
    { path: "/my-finances", icon: "wallet", label: "Minhas Finanças" },
    { path: "/my-portfolio", icon: "briefcase", label: "Meu Portfólio" },
    { path: "/market/assets", icon: "chart-line", label: "Ativos de Mercado" },
    { path: "/investment-simulator", icon: "calculator", label: "Simulador" },
    { path: "/education", icon: "book-reader", label: "Educação" }, 
    { path: "/news", icon: "newspaper", label: "Notícias" },
  ];

  const infoSupportMenuItems = [
    { path: "/profile", icon: "user-circle", label: "Perfil" },
    { path: "/about", icon: "info-circle", label: "Sobre" },
    { path: "/contact", icon: "envelope", label: "Contato" },
    { path: "/help", icon: "question-circle", label: "Ajuda" },
  ];


  return (
    <div className="container-fluid p-0 d-flex flex-column min-vh-100">
      <AccessibilityTools />
      <div className="row g-0 flex-grow-1">
        {showSidebar && (
          <nav className="col-md-3 col-lg-2 d-none d-md-block bg-light sidebar shadow-sm border-end p-0">
            <div className="sidebar-sticky d-flex flex-column h-100 py-3">
              <div className="text-center mb-3 px-3">
                <Link to="/dashboard" className="text-decoration-none">
                  <h5 className="text-primary fw-bold mb-0">
                    <i className="fas fa-chart-pie me-2"></i>InvestSmart
                  </h5>
                </Link>
                {currentUser && (
                    <div className="small text-muted mt-1">
                        Olá, {currentUser.name ? currentUser.name.split(' ')[0] : 'Usuário'}
                    </div>
                )}
              </div>
              <ul className="nav flex-column px-2 flex-grow-1">
                {mainToolsMenuItems.map(item => ( 
                    <li className="nav-item" key={item.path}>
                        <Link 
                            className={`nav-link ${(location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path) && item.path !== "/dashboard" && !isPublicPath(item.path)) ) ? 'active text-primary fw-bold' : ''}`} 
                            to={item.path}
                        >
                            <i className={`fas fa-${item.icon} fa-fw me-2`}></i> {item.label}
                        </Link>
                    </li>
                ))}
                <hr className="sidebar-divider my-2 mx-2" />
                <div className="sidebar-heading px-2 text-muted small text-uppercase mb-1">
                  Configurações e Suporte
                </div>
                {infoSupportMenuItems.map(item => (
                    <li className="nav-item" key={item.path}>
                        <Link className={`nav-link ${location.pathname === item.path ? 'active text-primary fw-bold' : ''}`} to={item.path}>
                            <i className={`fas fa-${item.icon} fa-fw me-2`}></i> {item.label}
                        </Link>
                    </li>
                ))}
              </ul>
              <div className="px-2 pb-2 mt-auto">
                <button
                  className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt fa-fw me-2"></i> Sair
                </button>
              </div>
            </div>
          </nav>
        )}
        
        <main role="main" className={`${showSidebar ? "col-md-9 ms-sm-auto col-lg-10" : "col-12"} px-md-4`}>
          <div className="py-3">
            <Routes>
              <Route path="/login" element={token && currentUser && !loadingProfile ? <Navigate to="/dashboard" replace /> : <Login setToken={handleLoginSuccess} />} />
              <Route path="/register" element={token && currentUser && !loadingProfile ? <Navigate to="/dashboard" replace /> : <Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />

              <Route
                path="/"
                element={
                  token && currentUser && !loadingProfile ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace state={{ from: location }} />
                }
              />

              {/* Rotas Protegidas */}
              <Route path="/dashboard" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><Dashboard token={token} currentUser={currentUser} /></ProtectedRoute> } />
              <Route path="/profile" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><Profile currentUser={currentUser} token={token} /></ProtectedRoute> } />
              <Route path="/my-finances" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><FinancialManagementPage token={token} /></ProtectedRoute> } />
              <Route path="/news" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><News /></ProtectedRoute> } />
              <Route path="/market/assets" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><InvestmentsPage token={token} /></ProtectedRoute> } />
              <Route path="/market/asset/:symbol" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><AssetDetailsPage token={token} /></ProtectedRoute> } />
              <Route path="/my-portfolio" element={ <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}><MyPortfolioPage token={token} /></ProtectedRoute> } />
              <Route 
                path="/investment-simulator" 
                element={ 
                  <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}>
                    <InvestmentSimulator token={token} />
                  </ProtectedRoute> 
                } 
              />
              <Route 
                path="/education" 
                element={ 
                  <ProtectedRoute token={token} currentUser={currentUser} loadingProfile={loadingProfile}>
                    <EducationPage /> 
                  </ProtectedRoute> 
                } 
              />
              
              <Route path="*" element={<div className="text-center mt-5 vh-100"><h2>Página não encontrada (404)</h2><p>O endereço que você tentou acessar não existe.</p><Link className="btn btn-primary" to={token && currentUser ? "/dashboard" : "/login"}>Voltar para o início</Link></div>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;