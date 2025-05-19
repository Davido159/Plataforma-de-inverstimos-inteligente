import React from 'react';

const Help = () => {
  return (
    <main className="page-container" role="main" aria-labelledby="help-title">
      <h2 id="help-title" className="text-center mb-4">Central de Ajuda</h2>

      <section aria-labelledby="faq-title" className="mb-5">
        <h3 id="faq-title" className="h5 mb-3">Perguntas Frequentes (FAQ)</h3>
        <div className="accordion" id="faqAccordion">
          <div className="accordion-item">
            <h4 className="accordion-header" id="headingOne">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                Como começo a usar a plataforma?
              </button>
            </h4>
            <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                Para começar, crie uma conta clicando em "Registrar". Após o registro e login, você terá acesso ao Dashboard, onde poderá conectar suas contas de investimento ou simular portfólios. Explore as análises e recomendações personalizadas.
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h4 className="accordion-header" id="headingTwo">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                Meus dados estão seguros?
              </button>
            </h4>
            <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                A segurança dos seus dados é nossa prioridade máxima. Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança da informação para proteger suas informações financeiras e pessoais.
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h4 className="accordion-header" id="headingThree">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                Como as recomendações de investimento são geradas?
              </button>
            </h4>
            <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                Nossas recomendações são baseadas em algoritmos inteligentes que analisam seu perfil de investidor, seus objetivos financeiros e as condições atuais do mercado. Elas são sugestões para auxiliar sua tomada de decisão, não conselhos financeiros formais.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="support-title">
        <h3 id="support-title" className="h5 mb-3">Suporte Adicional</h3>
        <p>
          Se você não encontrou a resposta para sua pergunta em nosso FAQ, ou precisa de assistência adicional, por favor, entre em contato conosco através da nossa página de <a href="/contact">Contato</a>.
        </p>
        <p>
          Nossa equipe de suporte está pronta para ajudar com quaisquer dúvidas ou problemas que você possa ter ao utilizar a Plataforma de Investimentos Inteligentes.
        </p>
      </section>
    </main>
  );
};

export default Help;