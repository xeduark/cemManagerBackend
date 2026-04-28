import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from './index.js'; 

// Mockeamos la base de datos para que el test no dependa de si la DB está prendida
vi.mock('./db.js', () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [] })
  }
}));

describe('Pruebas de Endpoints', () => {
  
  it('GET / debe responder que el backend funciona', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Backend Acta Manager funcionando ✅');
  });

  it('GET /api/actas/laptop-marcas debería devolver un 200', async () => {
    const response = await request(app).get('/api/actas/laptop-marcas');
    // Verificamos que la ruta existe y responde (aunque el controlador devuelva vacío)
    expect(response.status).toBe(200);
  });

  it('GET /api/actas/latest debería responder con un array', async () => {
    const response = await request(app).get('/api/actas/latest');
    expect(response.status).toBe(200);
    // Verificamos que lo que llegue sea un objeto/array y no un error
    expect(typeof response.body).toBe('object');
  });

});
