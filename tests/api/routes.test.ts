import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { apiRouter } from '../../src/api/routes';

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
  });

  it('should have agent routes mounted', async () => {
    const response = await supertest(app).get('/api/agent/health');
    expect(response.status).not.toBe(404);
  });

  it('should have admin routes mounted', async () => {
    const response = await supertest(app).get('/api/admin/health');
    expect(response.status).not.toBe(404);
  });
});