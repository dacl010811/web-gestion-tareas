const request = require('supertest');
const { app } = require('../server');
const pool = require('../db/database');
const bcrypt = require('bcryptjs');

describe('Autenticación (Prioridad Alta)', () => {
  describe('POST /api/auth/register', () => {
    test('Debe registrar un nuevo usuario correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('No debe permitir registrar usuario con email duplicado', async () => {
      // Registrar primero
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'duplicate@example.com',
          password: 'password123'
        });

      // Intentar registrar de nuevo con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'password456'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('Debe almacenar la contraseña hasheada (no en texto plano)', async () => {
      // Registrar usuario
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'hashuser',
          email: 'hash@example.com',
          password: 'secret123'
        });

      // Consultar BD directamente
      const [rows] = await pool.query(
        'SELECT password_hash FROM users WHERE email = ?',
        ['hash@example.com']
      );

      expect(rows.length).toBe(1);
      expect(rows[0].password_hash).not.toBe('secret123');
      // Verificar que el hash es válido
      const isValid = await bcrypt.compare('secret123', rows[0].password_hash);
      expect(isValid).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'loginpass123'
        });
    });

    test('Debe iniciar sesión con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'loginpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('loginuser');
    });

    test('Debe fallar con credenciales incorrectas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    test('Debe verificar sesión activa', async () => {
      const agent = request.agent(app);

      // Registrar y loguear
      await agent
        .post('/api/auth/register')
        .send({
          username: 'meuser',
          email: 'me@example.com',
          password: 'mepass123'
        });

      const response = await agent.get('/api/auth/me');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('meuser');
    });

    test('Debe fallar sin sesión activa', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
