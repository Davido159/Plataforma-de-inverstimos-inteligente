import React from 'react';
import { render, screen } from '@testing-library/react';
import About from '../About'; 
import '@testing-library/jest-dom'; 

describe('About Component', () => {
  test('Deve exibir informações sobre a plataforma', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: /sobre a plataforma/i })).toBeInTheDocument();
    
    expect(screen.getByText(/ajuda você a tomar decisões financeiras/i)).toBeInTheDocument();
    expect(screen.getByText(/tecnologia de ponta/i)).toBeInTheDocument();
  });
});