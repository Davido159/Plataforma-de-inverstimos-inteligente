import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // UseNavigate no lugar do useHistory

  const validateForm = () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/auth/login', { email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard'); // Usando navigate para redirecionar
    } catch (error) {
      console.error("Erro no login:", error);
      setError('Falha no login. Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container" role="main" aria-labelledby="login-title">
      <form onSubmit={handleSubmit} className="login-form" aria-label="Formulário de login">
        <h2 id="login-title">Login</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="form-control"
            required
            aria-required="true"
            aria-label="Email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="form-control"
            required
            aria-required="true"
            aria-label="Senha"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
};

export default Login;
