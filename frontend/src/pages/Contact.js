import React, { useState } from 'react';

const Contact = () => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="page-container" role="main" aria-labelledby="contact-title">
      <h2 id="contact-title">Fale Conosco</h2>

      {sent ? (
        <div className="alert alert-success" role="alert">
          Mensagem enviada com sucesso! Entraremos em contato em breve.
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-label="Formulário de contato">
          <div className="form-group">
            <label htmlFor="message">Mensagem:</label>
            <textarea
              id="message"
              rows="5"
              className="form-control"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              aria-required="true"
              aria-label="Mensagem"
            />
          </div>
          <button type="submit" className="btn btn-primary">Enviar</button>
        </form>
      )}
    </main>
  );
};

export default Contact;
