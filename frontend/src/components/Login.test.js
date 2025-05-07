import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Para matchers extras como .toBeInTheDocument()
import axios from 'axios'; // Importamos para poder mockar
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import Login from './Login';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(), // Mock do useNavigate
}));

describe('Login Component', () => {
  it('renderiza o formulário de login corretamente', () => {
    render(<Login setToken={() => {}} />); // Passa uma função mock para setToken
    
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('permite ao usuário digitar email e senha', () => {
    render(<Login setToken={() => {}} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'senha123' } });

    expect(emailInput.value).toBe('teste@exemplo.com');
    expect(passwordInput.value).toBe('senha123');
  });

  it('chama a API de login, atualiza o token e navega para o dashboard em caso de sucesso', async () => {
    const mockSetToken = jest.fn(); // Cria uma função mock para setToken
    const fakeToken = 'fake-jwt-token';
    const fakeEmail = 'teste@exemplo.com';
    const fakePassword = 'senha123';
    
    const mockNavigate = jest.fn(); // Mock de navigate

    axios.post.mockResolvedValue({ data: { token: fakeToken } });
    useNavigate.mockReturnValue(mockNavigate); // Retorna o mock do navigate

    render(<Login setToken={mockSetToken} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: fakeEmail } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: fakePassword } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      // Verifica se axios.post foi chamado com os dados corretos
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/auth/login', {
        email: fakeEmail,
        password: fakePassword,
      });
    });

    expect(mockSetToken).toHaveBeenCalledWith(fakeToken);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard'); // Verifica se a navegação foi feita para o dashboard
  });

  it('mostra um erro (no console) se o login falhar', async () => {
    const mockSetToken = jest.fn();
    const fakeEmail = 'errado@exemplo.com';
    const fakePassword = 'errada';
    const errorMessage = 'Credenciais inválidas';

    axios.post.mockRejectedValue({ response: { data: { error: errorMessage } } });

    // Mock console.error para verificar se ele é chamado
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Login setToken={mockSetToken} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: fakeEmail } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: fakePassword } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/auth/login', {
        email: fakeEmail,
        password: fakePassword,
      });
    });

    expect(mockSetToken).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
