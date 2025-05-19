import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        name, email, password
      });
      setSuccess(true);
    } catch (err) {
      console.error('Erro no registro:', err);
      setError('Erro ao registrar. Tente novamente.');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h2 className="h4 m-0 font-weight-bold text-primary text-center">Registrar</h2>
          </div>
          <div className="card-body">
            {success ? (
              <div className="alert alert-success">
                Registrado com sucesso! Faça login.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label>Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button type="submit" className="btn btn-primary w-100">Registrar</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
