import React from 'react';
import { Link } from 'react-router-dom';

const Profile = ({ currentUser, token }) => {

  if (!token) {
    return (
      <main className="page-container text-center" role="main">
        <h2 id="profile-title">Meu Perfil</h2>
        <p>Você precisa estar logado para ver seu perfil.</p>
        <Link to="/login" className="btn btn-primary">Fazer Login</Link>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="page-container text-center" role="main">
        <h2 id="profile-title">Meu Perfil</h2>
        <p>Carregando dados do perfil...</p>
      </main>
    );
  }

  const memberSince = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Data não disponível';

  return (
    <main className="page-container" role="main" aria-labelledby="profile-title">
      <h2 id="profile-title" className="text-center mb-4">Meu Perfil</h2>
      <div className="card shadow-sm">
        <div className="card-header">
          Informações Pessoais
        </div>
        <div className="card-body">
          <section aria-label="Informações do usuário">
            <dl className="row">
              <dt className="col-sm-3">Nome:</dt>
              <dd className="col-sm-9">{currentUser.name || 'Não informado'}</dd>

              <dt className="col-sm-3">Email:</dt>
              <dd className="col-sm-9">{currentUser.email || 'Não informado'}</dd>

              {currentUser.createdAt && (
                <>
                  <dt className="col-sm-3">Membro desde:</dt>
                  <dd className="col-sm-9">{memberSince}</dd>
                </>
              )}
              {}
            </dl>
          </section>
          {}
          {}
        </div>
      </div>

      {}
      {}
    </main>
  );
};

export default Profile;