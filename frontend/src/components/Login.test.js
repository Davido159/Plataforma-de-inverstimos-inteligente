import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom'; 
import Login from './Login';
import App from '../App'; 
jest.mock('axios');

describe('Login Component', () => {
  const renderLoginWithRouter = (setTokenMock = jest.fn()) => {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login setToken={setTokenMock} />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} /> {}
        </Routes>
      </MemoryRouter>
    );
  };


  it('renderiza o formulário de login corretamente', () => {
    renderLoginWithRouter();
    
    expect(screen.getByRole('heading', { name: /bem-vindo de volta!/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/endereço de email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('permite ao usuário digitar email e senha', () => {
    renderLoginWithRouter();

    const emailInput = screen.getByPlaceholderText(/endereço de email/i);
    const passwordInput = screen.getByPlaceholderText(/senha/i);

    fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'senha123' } });

    expect(emailInput.value).toBe('teste@exemplo.com');
    expect(passwordInput.value).toBe('senha123');
  });

  it('chama a API de login e chama setToken em caso de sucesso', async () => {
    const mockSetToken = jest.fn(); 
    const fakeToken = 'fake-jwt-token';
    const fakeEmail = 'teste@exemplo.com';
    const fakePassword = 'senha123';
    
    axios.post.mockResolvedValue({ data: { token: fakeToken } });

    renderLoginWithRouter(mockSetToken);

    fireEvent.change(screen.getByPlaceholderText(/endereço de email/i), { target: { value: fakeEmail } });
    fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: fakePassword } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/auth/login', {
        email: fakeEmail,
        password: fakePassword,
      });
    });
    expect(mockSetToken).toHaveBeenCalledWith(fakeToken);

  });


  it('mostra uma mensagem de erro se o login falhar', async () => {
    const mockSetToken = jest.fn();
    const fakeEmail = 'errado@exemplo.com';
    const fakePassword = 'errada';
    const errorMessage = 'Credenciais inválidas.'; 

    axios.post.mockRejectedValue({ response: { data: { message: errorMessage } } }); 

    renderLoginWithRouter(mockSetToken);

    fireEvent.change(screen.getByPlaceholderText(/endereço de email/i), { target: { value: fakeEmail } });
    fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: fakePassword } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/auth/login', {
        email: fakeEmail,
        password: fakePassword,
      });
    });

    expect(mockSetToken).not.toHaveBeenCalled();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('mostra erro de validação para campos vazios', async () => {
    renderLoginWithRouter();
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
        expect(screen.getByText('Por favor, preencha todos os campos.')).toBeInTheDocument();
    });
  });

  it('mostra erro de validação para email inválido', async () => {
    renderLoginWithRouter();
    fireEvent.change(screen.getByPlaceholderText(/endereço de email/i), { target: { value: 'emailinvalido' } });
    fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
        expect(screen.getByText('Por favor, insira um email válido.')).toBeInTheDocument();
    });
  });
});


describe('App Navigation after Login', () => {
    beforeEach(() => {
      localStorage.clear(); 
      axios.post.mockReset();
      axios.get.mockReset();
    });
  
    test('navega para /dashboard após login bem-sucedido', async () => {
      const fakeToken = 'fake-jwt-token';
      const fakeUser = { id: 1, name: 'Test User', email: 'test@example.com', createdAt: new Date().toISOString() };
  
      axios.post.mockResolvedValueOnce({ data: { token: fakeToken } }); // Mock para /auth/login
      axios.get.mockResolvedValueOnce({ data: fakeUser }); // Mock para /api/users/me
  
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App /> 
        </MemoryRouter>
      );
  
      fireEvent.change(screen.getByPlaceholderText(/endereço de email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
  
      await waitFor(() => expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.anything()));
      
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/users/me'), expect.anything()));
  
      expect(await screen.findByText(/Dashboard/i, {}, {timeout: 3000})).toBeInTheDocument(); // Aumentado timeout para dar tempo de renderizar
    });
  });