import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

// Import the Express app — server.js must export app before calling listen()
// (we will fix server.js in Step C to export app)
import { app } from '../server.js';
import Admin from '../models/Admin.js';
import Investor from '../models/Investor.js';
import Farmer from '../models/Farmer.js';

let mongod;
let request;

// ── SETUP ────────────────────────────────────────────────────
before(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create({
    binary: {
      arch: 'x64',
      version: '6.0.15',
    },
  });
  await mongoose.connect(mongod.getUri());

  // Seed a test admin
  await Admin.create({
    email: 'testadmin@sahelagriconnect.com',
    password: 'TestPass123!',
    name: 'Test Admin',
    role: 'super-admin',
  });

  // Seed a test investor
  await Investor.create({
    fullName: 'Test Investor',
    email: 'testinvestor@afriyield.com',
    investmentTrack: 'Track A',
    commodityInterest: 'Sesame',
    investmentRange: '$10,000 - $50,000',
  });

  request = supertest(app);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

// ── FLOW 1: Admin authentication ─────────────────────────────
describe('Admin auth flow', () => {
  it('POST /api/auth/login — valid credentials return 200 + JWT', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'testadmin@sahelagriconnect.com', password: 'TestPass123!' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'token must be present');
    assert.ok(res.body.admin?.email, 'admin profile must be present');
  });

  it('POST /api/auth/login — wrong password returns 401', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'testadmin@sahelagriconnect.com', password: 'wrongpassword' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, undefined);
  });

  it('POST /api/auth/login — missing fields returns 400', async () => {
    const res = await request.post('/api/auth/login').send({ email: 'testadmin@sahelagriconnect.com' });
    assert.equal(res.status, 400);
  });

  it('GET /api/auth/verify — valid token returns 200', async () => {
    const login = await request
      .post('/api/auth/login')
      .send({ email: 'testadmin@sahelagriconnect.com', password: 'TestPass123!' });
    const token = login.body.token;

    const res = await request.get('/api/auth/verify').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.valid, true);
  });

  it('GET /api/auth/verify — no token returns 401', async () => {
    const res = await request.get('/api/auth/verify');
    assert.equal(res.status, 401);
  });
});

// ── FLOW 2: Farmer registration ──────────────────────────────
describe('Farmer registration flow', () => {
  const validFarmer = {
    nom: 'Amadou Diallo',
    telephone: '+22376543210',
    email: 'amadou@test.com',
    latitude: '12.6392',
    longitude: '-8.0029',
    superficie: 12,
    cultures: ['Riz', 'Mil'],
    region: 'Sikasso',
    typeExploitation: 'Familiale',
    objectifsProduction: ['Souveraineté alimentaire locale'],
    accesElectricite: 'Non',
    accesStockage: 'Non',
    lienCooperative: 'Non',
  };

  it('POST /api/farmers — valid payload returns 201 + farmer object', async () => {
    const res = await request.post('/api/farmers').send(validFarmer);
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.farmer?._id, 'farmer _id must be present');
    assert.equal(res.body.farmer.nom, validFarmer.nom);
  });

  it('POST /api/farmers — missing required fields returns 400', async () => {
    const res = await request.post('/api/farmers').send({ nom: 'Incomplete', telephone: '+22300000000' });
    assert.equal(res.status, 400);
  });

  it('POST /api/farmers — invalid typeExploitation returns 400', async () => {
    const res = await request.post('/api/farmers').send({ ...validFarmer, typeExploitation: 'InvalidType' });
    assert.equal(res.status, 400);
  });

  it('GET /api/farmers — self-lookup by email returns farmer', async () => {
    const res = await request.get('/api/farmers').query({ email: 'amadou@test.com' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.farmer.nom, validFarmer.nom);
  });
});

// ── FLOW 3: Investor authentication ─────────────────────────
describe('Investor auth flow', () => {
  it('POST /api/investors/login — registered email returns 200 + JWT', async () => {
    const res = await request.post('/api/investors/login').send({ email: 'testinvestor@afriyield.com' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'investor token must be present');
    assert.ok(res.body.investor?.email, 'investor profile must be present');
  });

  it('POST /api/investors/login — unknown email returns 404', async () => {
    const res = await request.post('/api/investors/login').send({ email: 'nobody@unknown.com' });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('GET /api/investments/investor/:email — no token returns 401', async () => {
    const res = await request.get('/api/investments/investor/testinvestor@afriyield.com');
    assert.equal(res.status, 401);
  });

  it('GET /api/investments/investor/:email — valid token returns 200', async () => {
    const login = await request.post('/api/investors/login').send({ email: 'testinvestor@afriyield.com' });
    const token = login.body.token;

    const res = await request
      .get('/api/investments/investor/testinvestor@afriyield.com')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
  });
});

// ── FLOW 4: Health check ─────────────────────────────────────
describe('System', () => {
  it('GET /api/health — returns 200', async () => {
    const res = await request.get('/api/health');
    assert.equal(res.status, 200);
  });
});

