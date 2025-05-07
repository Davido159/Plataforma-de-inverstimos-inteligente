const request = require('supertest');
const express = require('express');
const app = express();
const authRoutes = require('../routes/auth');

app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth API', () => {
  it('deve registrar um novo usuário', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Teste',
        email: `teste${Date.now()}@example.com`,
        password: 'password123'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message');
  });

  it('não deve registrar usuário existente', async () => {
    const email = `testeexistente@example.com`;
    await request(app)
      .post('/auth/register')
      .send({
        name: 'Teste',
        email: email,
        password: 'password123'
      });
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Teste',
        email: email,
        password: 'password123'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });
});
