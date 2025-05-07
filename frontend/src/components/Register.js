import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/register', { name, email, password });
      alert("Registrado com sucesso! Faça login.");
    } catch (error) {
      console.error("Erro no registro:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Registro</h2>
      <div className="mb-3">
        <label>Nome:</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control"/>
      </div>
      <div className="mb-3">
        <label>Email:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control"/>
      </div>
      <div className="mb-3">
        <label>Senha:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control"/>
      </div>
      <button type="submit" className="btn btn-primary">Registrar</button>
    </form>
  );
};

export default Register;
