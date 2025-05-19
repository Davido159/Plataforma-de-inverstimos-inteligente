import React from 'react';


const getAssetType = (symbol) => {
  const s = symbol.toUpperCase();
  if (s.includes('.SA') && (s.endsWith('3') || s.endsWith('4') || s.endsWith('11'))) {
    if (s.includes('FII')) return 'FII'; 
    return 'Ação B3';
  }
  if (s.startsWith('TESOURO') || s.includes('SELIC') || s.includes('IPCA') || s.includes('PREFIXADO')) {
    return 'Renda Fixa Pública';
  }
  if (s.includes('CDB') || s.includes('LCI') || s.includes('LCA')) {
    return 'Renda Fixa Privada';
  }
  if (s.length <= 4 && /^[A-Z]+$/.test(s)) { 
    return 'Ação EUA';
  }
  if (s.includes('ETF')) {
    return 'ETF';
  }
  return 'Outro';
};

const InvestmentRecommendations = ({ monthlyBalance, portfolioData = [] }) => { 
  let recommendations = [];

  if (monthlyBalance === null || monthlyBalance === undefined) {
    return (
      <div className="card shadow-sm mt-4">
        <div className="card-header"><h3 className="h5 mb-0">Sugestões de Investimento Inteligente</h3></div>
        <div className="card-body"><p className="text-muted">Calcule seu saldo mensal para ver sugestões personalizadas.</p></div>
      </div>
    );
  }

  const balance = parseFloat(monthlyBalance);

  let hasPortfolio = portfolioData && portfolioData.length > 0;
  let portfolioValue = 0;
  let assetTypesInPortfolio = new Set();
  let assetSymbolsInPortfolio = new Set();
  let largestSingleAssetValue = 0;
  let largestSingleAssetSymbol = '';

  if (hasPortfolio) {
    portfolioData.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.currentPrice || item.purchasePrice) || 0;
      const value = quantity * price;
      portfolioValue += value;
      assetTypesInPortfolio.add(getAssetType(item.symbol));
      assetSymbolsInPortfolio.add(item.symbol.toUpperCase());
      if (value > largestSingleAssetValue) {
        largestSingleAssetValue = value;
        largestSingleAssetSymbol = item.symbol.toUpperCase();
      }
    });
  }
  const concentrationRatio = portfolioValue > 0 ? (largestSingleAssetValue / portfolioValue) * 100 : 0;


  if (balance <= 0) {
    recommendations.push({ 
        title: "Prioridade: Organizar Finanças e Sair do Vermelho",
        description: "Seu saldo está negativo ou zerado. O foco total deve ser em entender seus gastos, criar um orçamento realista e eliminar dívidas...",
        type: "alert-danger", icon: "fas fa-exclamation-triangle"
    });
     recommendations.push({
      title: "Recurso Útil", description: "Considere ler sobre como sair das dívidas...",
      link: "https://www.serasa.com.br/limpa-nome-online/", linkText: "Consultar Serasa Limpa Nome",
      type: "alert-secondary", icon: "fas fa-book-reader"
    });
  }

  else if (balance > 0 && balance <= 100) {
    recommendations.push({ 
        title: "Parabéns pelo Saldo Positivo! Comece sua Reserva.",
        description: `Com R$ ${balance.toFixed(2)}, o passo mais importante é iniciar sua reserva de emergência...`,
        type: "alert-info", icon: "fas fa-piggy-bank"
    });
    if (!hasPortfolio || portfolioValue < 500) { 
        recommendations.push({
            title: "Dica de Ouro", description: "Crie o hábito de poupar, mesmo que pequenas quantias...",
            type: "alert-light border", icon: "far fa-lightbulb"
        });
    }
  }

  else if (balance > 100 && balance <= 500) {
    recommendations.push({ 
        title: "Fortalecendo sua Reserva de Emergência",
        description: `Com R$ ${balance.toFixed(2)}, continue focando na sua reserva... Explore CDBs com liquidez diária ou o Tesouro Selic.`,
        link: "https://www.tesourodireto.com.br/titulos/tipos-de-tesouro/tesouro-selic.htm", linkText: "Saber mais sobre Tesouro Selic",
        type: "alert-success", icon: "fas fa-shield-alt"
    });
     if (hasPortfolio && assetTypesInPortfolio.has('Renda Fixa Pública') && assetTypesInPortfolio.size === 1) {
        recommendations.push({
            title: "Aprofunde em Renda Fixa",
            description: "Você já investe em Renda Fixa Pública. Que tal estudar sobre CDBs de bancos menores (com proteção FGC) ou LCIs/LCAs para diversificar dentro da renda fixa?",
            type: "alert-info", icon: "fas fa-search-dollar"
        });
    } else if (!hasPortfolio) {
        recommendations.push({
            title: "Objetivo da Reserva", description: "Sua reserva deve cobrir de 3 a 12 meses dos seus custos...",
            type: "alert-light border", icon: "fas fa-bullseye"
        });
    }
  }
  

  else if (balance > 500 && balance <= 2000) {
    recommendations.push({
      title: "Reserva Sólida, Potencial para Primeiros Passos!",
      description: `Com R$ ${balance.toFixed(2)} de saldo e sua reserva de emergência bem encaminhada, é hora de pensar nos próximos passos. Mantenha a maior parte em segurança.`,
      type: "alert-primary",
      icon: "fas fa-graduation-cap"
    });

    if (hasPortfolio) {
      if (!assetTypesInPortfolio.has('Ação B3') && !assetTypesInPortfolio.has('ETF') && !assetTypesInPortfolio.has('FII')) {
        recommendations.push({
          title: "Considere Diversificar com Renda Variável",
          description: "Seu portfólio parece focado em renda fixa. Com uma pequena parcela, estude ETFs que replicam índices (como BOVA11/IVVB11) ou FIIs para uma primeira experiência em renda variável com diversificação.",
          type: "alert-info", icon: "fas fa-chart-pie"
        });
      }
      if (concentrationRatio > 60 && assetSymbolsInPortfolio.size > 1) { 
        recommendations.push({
          title: "Atenção à Concentração!",
          description: `Mais de ${concentrationRatio.toFixed(0)}% do seu portfólio está concentrado em ${largestSingleAssetSymbol}. Considere diversificar seus próximos aportes para reduzir o risco.`,
          type: "alert-warning", icon: "fas fa-exclamation-circle"
        });
      }
       if (assetTypesInPortfolio.has('Ação B3') && assetSymbolsInPortfolio.size < 5) {
         recommendations.push({
            title: "Diversifique sua Carteira de Ações",
            description: "Você já investe em ações. Lembre-se que para uma boa diversificação em ações, o ideal é ter entre 10-15 ativos de setores diferentes. Estude mais empresas.",
            type: "alert-light border", icon: "fas fa-microscope"
        });
      }
    } else { 
      recommendations.push({
        title: "Introdução à Renda Variável (com cautela)",
        description: "Com uma pequena parcela, comece a explorar Fundos de Investimento diversificados ou ETFs. Lembre-se, renda variável exige estudo e paciência.",
        type: "alert-info", icon: "fas fa-chart-line"
      });
    }
  }

  else if (balance > 2000 && balance <= 10000) {
    recommendations.push({
      title: "Expandindo Horizontes de Investimento",
      description: `Com R$ ${balance.toFixed(2)} de saldo mensal, você tem um bom potencial para diversificar. Certifique-se que sua reserva de emergência está completa.`,
      type: "alert-success", icon: "fas fa-seedling"
    });
    if (hasPortfolio) {
      if (!assetTypesInPortfolio.has('FII') && assetTypesInPortfolio.has('Ação B3')) {
        recommendations.push({
          title: "Explore Fundos Imobiliários (FIIs)",
          description: "FIIs podem ser uma ótima forma de gerar renda passiva com aluguéis e diversificar sua carteira de renda variável. Estude os diferentes tipos de FIIs.",
          link: "https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/fundos-de-investimento-imobiliario-fii.htm", linkText: "Conheça os FIIs na B3",
          type: "alert-info", icon: "fas fa-building"
        });
      }
      if (!assetTypesInPortfolio.has('Ação EUA') && !assetTypesInPortfolio.has('ETF Internacional') && portfolioValue > 5000) { 
         recommendations.push({
            title: "Diversificação Internacional",
            description: "Considere alocar uma parte dos seus investimentos no exterior para dolarizar parte do patrimônio e acessar outros mercados. ETFs (como IVVB11 ou WRLD11) ou BDRs são um bom começo.",
            type: "alert-info", icon: "fas fa-plane-departure"
        });
      }
       if (concentrationRatio > 50) {
        recommendations.push({
          title: "Revise a Concentração do Portfólio",
          description: `Seu portfólio mostra uma concentração de ${concentrationRatio.toFixed(0)}% em ${largestSingleAssetSymbol}. Reavalie sua estratégia de diversificação para mitigar riscos.`,
          type: "alert-warning", icon: "fas fa-balance-scale-left"
        });
      }
    } else { 
         recommendations.push({
            title: "Construa uma Carteira Diversificada",
            description: "Com este aporte, você pode começar a montar uma carteira diversificada incluindo Renda Fixa (Tesouro Selic, CDBs), FIIs e uma parcela em Ações/ETFs. Defina seus percentuais para cada classe de ativo.",
            type: "alert-primary", icon: "fas fa-sitemap"
        });
    }
  }
  


  else if (balance > 10000) { 
    recommendations.push({
      title: "Otimização e Estratégias Avançadas",
      description: `Com um saldo mensal de R$ ${balance.toFixed(2)}, o foco é em otimizar sua carteira e explorar estratégias mais avançadas, sempre alinhadas ao seu perfil.`,
      type: "alert-primary", icon: "fas fa-cogs"
    });

    if (hasPortfolio) {
      let hasInternational = assetTypesInPortfolio.has('Ação EUA') || assetTypesInPortfolio.has('ETF Internacional') || Array.from(assetSymbolsInPortfolio).some(s => s.includes('IVVB11') || s.includes('WRLD11')); 
      let hasCrypto = Array.from(assetSymbolsInPortfolio).some(s => s.includes('BTC') || s.includes('ETH')); 

      if (!hasInternational && portfolioValue > 20000) { 
        recommendations.push({
          title: "Fortaleça a Diversificação Internacional",
          description: "Se ainda não o fez, é um bom momento para aumentar a exposição a ativos internacionais. Considere ETFs de mercados desenvolvidos e emergentes, ou BDRs de empresas específicas.",
          type: "alert-info", icon: "fas fa-globe-americas"
        });
      }
      if (portfolioValue > 50000 && !hasCrypto && balance > 2000) { 
        recommendations.push({
            title: "Explorar Ativos Alternativos (com alta cautela)",
            description: "Com uma parcela muito pequena do seu portfólio (1-5%), e após muito estudo, você poderia considerar ativos alternativos como criptomoedas. Entenda a volatilidade e os riscos envolvidos.",
            type: "alert-warning", icon: "fab fa-bitcoin"
        });
      }
      if (balance > 20000 || portfolioValue > 100000) { 
         recommendations.push({
            title: "Considere Consultoria Profissional",
            description: "Para otimizar a gestão do seu patrimônio, alocação de ativos e planejamento tributário/sucessório, buscar um planejador financeiro certificado (CFP) ou um consultor de investimentos (CVM) pode ser muito valioso.",
            type: "alert-success", icon: "fas fa-user-tie"
        });
      }
    } else { 
        recommendations.push({
            title: "Planeje sua Estratégia de Longo Prazo",
            description: "Com este potencial de aporte, é crucial definir uma estratégia de alocação de ativos (Asset Allocation) que contemple seus objetivos de longo prazo, perfil de risco e inclua diversificação em diferentes classes e geografias.",
            type: "alert-info", icon: "fas fa-drafting-compass"
        });
    }
  }

  if (recommendations.length === 0 && balance > 0) {
     recommendations.push({
        title: "Continue Gerenciando Bem Suas Finanças!",
        description: `Seu saldo de R$ ${balance.toFixed(2)} é positivo! Continue buscando conhecimento para otimizar seus investimentos e alcançar seus objetivos.`,
        type: "alert-info", icon: "fas fa-thumbs-up"
    });
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="card shadow-sm mt-4 investment-recommendations">
      <div className="card-header">
        <h3 className="h5 mb-0"><i className="fas fa-lightbulb me-2 text-warning"></i>Sugestões Inteligentes</h3>
      </div>
      <div className="card-body">
        {recommendations.map((rec, index) => (
          <div key={index} className={`alert ${rec.type || 'alert-light'} d-flex align-items-start`} role="alert">
            {rec.icon && <i className={`${rec.icon} fa-fw fa-lg me-3 mt-1 opacity-75`}></i>} {/* fa-fw para largura fixa */}
            <div>
              <h4 className="alert-heading h6">{rec.title}</h4>
              <p className="mb-1 small">{rec.description}</p>
              {rec.link && (
                <p className="mb-0 small mt-1">
                  <a href={rec.link} target="_blank" rel="noopener noreferrer" className="alert-link fw-bold">
                    {rec.linkText || 'Saiba mais'} <i className="fas fa-external-link-alt fa-xs"></i>
                  </a>
                </p>
              )}
            </div>
          </div>
        ))}
        <small className="text-muted d-block mt-3">
          <strong>Atenção:</strong> Estas são sugestões educacionais e não constituem aconselhamento financeiro formal.
          A rentabilidade passada não garante rentabilidade futura. Os produtos mencionados são exemplos e podem não ser adequados ao seu perfil.
          Consulte um profissional qualificado antes de tomar decisões de investimento.
        </small>
      </div>
    </div>
  );
};

export default InvestmentRecommendations;
