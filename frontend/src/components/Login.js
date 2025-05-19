import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Login = ({ setToken: setTokenProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${apiUrl}/auth/login`, { email, password });
      setTokenProp(res.data.token);
    } catch (err) {
      console.error("Erro no login:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-xl-6 col-lg-7 col-md-9">
          <div className="card o-hidden border-0 shadow-lg my-5">
            <div className="card-body p-0">
              <div className="row">
                <div className="col-lg-12">
                  <div className="p-5">
                    <div className="text-center">
                      <h1 className="h4 text-gray-900 mb-4">Bem-vindo de Volta!</h1>
                    </div>
                    {}
                    {error && <div className="alert alert-danger text-center p-2 mb-3" role="alert">{error}</div>}
                    <form className="user" onSubmit={handleSubmit} noValidate>
                      <div className="form-group mb-3">
                        <input
                          id="email"
                          type="email"
                          className={`form-control form-control-user ${error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('credenciais inválidas')) ? 'is-invalid' : ''}`}
                          placeholder="Endereço de Email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>
                      <div className="form-group mb-3">
                        <input
                          id="password"
                          type="password"
                          className={`form-control form-control-user ${error && error.toLowerCase().includes('credenciais inválidas') ? 'is-invalid' : ''}`}
                          placeholder="Senha"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary btn-user w-100"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Carregando...
                          </>
                        ) : 'Entrar'}
                      </button>
                    </form>
                    <hr />
                    <div className="text-center">
                      <Link className="small" to="/register">Criar uma conta!</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;