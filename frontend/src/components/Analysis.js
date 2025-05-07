import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const Analysis = ({ investments }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (investments.length) {
      const ctx = chartRef.current.getContext('2d');
      const dates = investments.map(inv => new Date(inv.date).toLocaleDateString());
      const closingPrices = investments.map(inv => inv.close);

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Preço de Fechamento',
            data: closingPrices,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        }
      });
    }
  }, [investments]);

  if (!investments.length) return null;

  return (
    <div className="mt-4">
      <h2>Análise Gráfica</h2>
      <canvas ref={chartRef} width="400" height="200"></canvas>
    </div>
  );
};

export default Analysis;
