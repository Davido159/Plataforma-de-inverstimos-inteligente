import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Contact from '../Contact';
import '@testing-library/jest-dom/extend-expect';

describe('Contact Component', () => {
  test('Deve renderizar o formulário de contato', () => {
    render(<Contact />);

    expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  test('Deve exibir mensagem de sucesso ao enviar o formulário', async () => {
    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/mensagem enviada com sucesso/i)).toBeInTheDocument();
    });
  });
});
