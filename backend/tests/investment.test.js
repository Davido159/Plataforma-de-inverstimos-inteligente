const request = require('supertest');
const express = require('express');
const app = express();
const investmentRoutes = require('../routes/api');

app.use(express.json());
app.use('/api', investmentRoutes);

describe('Investment API', () => {
  it('deve retornar 401 se não houver token', async () => {
    const res = await request(app).post('/api/fetch-data').send({ symbol: 'AAPL' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error');
  });
});
