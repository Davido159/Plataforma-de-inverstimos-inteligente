import React from 'react';
import { render, screen } from '@testing-library/react';
import Profile from '../Profile';
import '@testing-library/jest-dom/extend-expect';

describe('Profile Component', () => {
  test('Deve exibir informações do usuário se o token estiver presente', () => {
    render(<Profile token="mocked_token" />);

    expect(screen.getByText(/meu perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/nome:/i)).toBeInTheDocument();
    expect(screen.getByText(/email:/i)).toBeInTheDocument();
  });

  test('Deve exibir mensagem solicitando login se não houver token', () => {
    render(<Profile token={null} />);

    expect(screen.getByText(/acesse sua conta para visualizar o perfil/i)).toBeInTheDocument();
  });
});
