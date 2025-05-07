import React, { useState } from 'react';
import axios from 'axios';
import InvestmentList from './InvestmentList';
import Analysis from './Analysis';

const Dashboard = ({ token }) => {
  const [symbol, setSymbol] = useState('');
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL;

      // Chama o endpoint para buscar e salvar dados
      await axios.post(
        `${baseUrl}/api/fetch-data`,
        { symbol },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Obtém o histórico atualizado
      const res = await axios.get(
        `${baseUrl}/api/investments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInvestments(res.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      // Sugestão: aqui você pode exibir um toast ou alerta ao usuário
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <label>Digite o símbolo do ativo (ex: AAPL):</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="form-control"
          placeholder="Símbolo"
        />
      </div>
      <button onClick={fetchData} className="btn btn-primary mb-3">
        {loading ? 'Carregando...' : 'Buscar Dados'}
      </button>
      <InvestmentList investments={investments} />
      <Analysis investments={investments} />
    </div>
  );
};

export default Dashboard;