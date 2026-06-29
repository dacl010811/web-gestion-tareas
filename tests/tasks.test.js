const request = require('supertest');
const { app } = require('../server');

describe('CRUD de Tareas y Aislamiento de Datos (Prioridad Alta)', () => {
  let agentUserA;
  let agentUserB;

  beforeEach(async () => {
    // Crear agentes para usuarios A y B
    agentUserA = request.agent(app);
    agentUserB = request.agent(app);

    // Registrar y loguear usuario A
    await agentUserA
      .post('/api/auth/register')
      .send({
        username: 'userA',
        email: 'usera@example.com',
        password: 'pass123'
      });

    // Registrar y loguear usuario B
    await agentUserB
      .post('/api/auth/register')
      .send({
        username: 'userB',
        email: 'userb@example.com',
        password: 'pass123'
      });
  });

  describe('POST /api/tasks', () => {
    test('Debe crear una tarea correctamente', async () => {
      const response = await agentUserA
        .post('/api/tasks')
        .send({
          title: 'Tarea de prueba',
          description: 'Descripción de prueba'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Tarea de prueba');
      expect(response.body.data.completed).toBe(0);
    });

    test('No debe crear tarea sin título', async () => {
      const response = await agentUserA
        .post('/api/tasks')
        .send({
          description: 'Sin título'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    test('Debe listar solo las tareas del usuario autenticado', async () => {
      // Usuario A crea 2 tareas
      await agentUserA.post('/api/tasks').send({ title: 'Tarea A1' });
      await agentUserA.post('/api/tasks').send({ title: 'Tarea A2' });

      // Usuario B crea 1 tarea
      await agentUserB.post('/api/tasks').send({ title: 'Tarea B1' });

      // Usuario A ve solo sus 2 tareas
      const responseA = await agentUserA.get('/api/tasks');
      expect(responseA.status).toBe(200);
      expect(responseA.body.data.length).toBe(2);
      expect(responseA.body.data.some(t => t.title === 'Tarea A1')).toBe(true);
      expect(responseA.body.data.some(t => t.title === 'Tarea A2')).toBe(true);

      // Usuario B ve solo su 1 tarea
      const responseB = await agentUserB.get('/api/tasks');
      expect(responseB.status).toBe(200);
      expect(responseB.body.data.length).toBe(1);
      expect(responseB.body.data[0].title).toBe('Tarea B1');
    });
  });

  describe('Aislamiento de Datos', () => {
    test('Usuario B no puede modificar tarea de Usuario A', async () => {
      // Usuario A crea una tarea
      const createResponse = await agentUserA
        .post('/api/tasks')
        .send({ title: 'Tarea de A' });
      const taskId = createResponse.body.data.id;

      // Usuario B intenta modificarla
      const updateResponse = await agentUserB
        .patch(`/api/tasks/${taskId}`)
        .send({ completed: 1 });

      expect(updateResponse.status).toBe(404);
      expect(updateResponse.body.success).toBe(false);
    });

    test('Usuario B no puede eliminar tarea de Usuario A', async () => {
      // Usuario A crea una tarea
      const createResponse = await agentUserA
        .post('/api/tasks')
        .send({ title: 'Tarea de A' });
      const taskId = createResponse.body.data.id;

      // Usuario B intenta eliminarla
      const deleteResponse = await agentUserB.delete(`/api/tasks/${taskId}`);

      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body.success).toBe(false);
    });
  });
});
