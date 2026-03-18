import fc from 'fast-check';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { loginValidator } from '../auth.validator';

// Minimal Express app that applies the loginValidator and returns 200 on success
function buildApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/api/auth/login',
    ...loginValidator,
    (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    }
  );
  return app;
}

const app = buildApp();

// Feature: deudasmart-auth-backend, Property 3: Campos requeridos ausentes producen HTTP 400
describe('Property 3: Campos requeridos ausentes producen HTTP 400', () => {
  // Validates: Requirements 2.1, 2.3
  it('body sin email retorna HTTP 400 con mensaje de campo requerido', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a valid password (≥8 chars) but omit email
        fc.string({ minLength: 8, maxLength: 30 }),
        async (password) => {
          const res = await request(app)
            .post('/api/auth/login')
            .send({ password });

          expect(res.status).toBe(400);
          const messages: string[] = res.body.errors.map((e: { msg: string }) => e.msg);
          expect(messages).toContain('El campo email es requerido');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('body sin password retorna HTTP 400 con mensaje de campo requerido', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a valid email
        fc.emailAddress(),
        async (email) => {
          const res = await request(app)
            .post('/api/auth/login')
            .send({ email });

          expect(res.status).toBe(400);
          const messages: string[] = res.body.errors.map((e: { msg: string }) => e.msg);
          expect(messages).toContain('El campo password es requerido');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: deudasmart-auth-backend, Property 4: Email con formato inválido produce HTTP 400
describe('Property 4: Email con formato inválido produce HTTP 400', () => {
  // Validates: Requirement 2.2
  it('email con formato inválido retorna HTTP 400 con mensaje de formato inválido', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate strings that are NOT valid emails
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
        fc.string({ minLength: 8, maxLength: 30 }),
        async (invalidEmail, password) => {
          const res = await request(app)
            .post('/api/auth/login')
            .send({ email: invalidEmail, password });

          expect(res.status).toBe(400);
          const messages: string[] = res.body.errors.map((e: { msg: string }) => e.msg);
          // Either "required" (empty string) or "invalid format"
          const hasEmailError =
            messages.includes('El campo email es requerido') ||
            messages.includes('El formato del email es inválido');
          expect(hasEmailError).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: deudasmart-auth-backend, Property 5: Password corto produce HTTP 400
describe('Property 5: Password corto produce HTTP 400', () => {
  // Validates: Requirement 2.4
  it('password con menos de 8 caracteres retorna HTTP 400 con mensaje de longitud mínima', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        // Passwords of length 1-7 (short passwords; empty string triggers "required" instead)
        fc.string({ minLength: 1, maxLength: 7 }),
        async (email, shortPassword) => {
          const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password: shortPassword });

          expect(res.status).toBe(400);
          const messages: string[] = res.body.errors.map((e: { msg: string }) => e.msg);
          expect(messages).toContain('El password debe tener al menos 8 caracteres');
        }
      ),
      { numRuns: 100 }
    );
  });
});
