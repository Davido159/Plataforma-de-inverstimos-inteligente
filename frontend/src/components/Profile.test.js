import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; 
import Profile from '../Profile'; 
import '@testing-library/jest-dom'; 

describe('Profile Component', () => {
  const mockUser = {
    id: 1,
    name: 'Usuário Teste',
    email: 'teste@example.com',
    createdAt: '2023-01-15T10:00:00.000Z', 
  };

  test('Deve exibir informações do usuário se o token e currentUser estiverem presentes', () => {
    render(
      <MemoryRouter> {}
        <Profile token="mocked_token" currentUser={mockUser} />
      </MemoryRouter>
    );

    expect(screen.getByText(/meu perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/nome:/i)).toBeInTheDocument();
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(/email:/i)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(/membro desde:/i)).toBeInTheDocument();
    expect(screen.getByText(new Date(mockUser.createdAt).toLocaleDateString('pt-BR', {
        year: 'numeric', month: 'long', day: 'numeric',
    }))).toBeInTheDocument();
  });

  test('Deve exibir mensagem para logar se não houver token', () => {
    render(
      <MemoryRouter>
        <Profile token={null} currentUser={null} />
      </MemoryRouter>
    );
    expect(screen.getByText(/você precisa estar logado para ver seu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fazer login/i})).toBeInTheDocument();
  });

  test('Deve exibir mensagem de carregamento se houver token mas currentUser for null (carregando)', () => {
    render(
      <MemoryRouter>
        <Profile token="mocked_token" currentUser={null} />
      </MemoryRouter>
    );
    expect(screen.getByText(/carregando dados do perfil.../i)).toBeInTheDocument();
  });
});