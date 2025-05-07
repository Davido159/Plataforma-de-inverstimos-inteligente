// src/pages/Profile.js
import React from 'react';

const Profile = () => {
  return (
    <main className="page-container" role="main" aria-labelledby="profile-title">
      <h2 id="profile-title">Meu Perfil</h2>
      <section aria-label="Informações do usuário">
        <p><strong>Nome:</strong> João da Silva</p>
        <p><strong>Email:</strong> joao@example.com</p>
        <p><strong>Membro desde:</strong> Janeiro de 2023</p>
      </section>
    </main>
  );
};

export default Profile;
