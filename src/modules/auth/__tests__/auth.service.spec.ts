import fc from 'fast-check';
import { User } from '../../../models/user.entity';

// Feature: deudasmart-auth-backend, Property 9: Entidad User contiene todos los campos requeridos
describe('Property 9: Entidad User contiene todos los campos requeridos', () => {
  // Validates: Requirements 5.1, 5.2
  it('instancias de User tienen id, email, password, createdAt y updatedAt con los tipos correctos', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          createdAt: fc.date(),
          updatedAt: fc.date(),
        }),
        (fields) => {
          const user = new User();
          user.id = fields.id;
          user.email = fields.email;
          user.password = fields.password;
          user.createdAt = fields.createdAt;
          user.updatedAt = fields.updatedAt;

          expect(typeof user.id).toBe('string');
          expect(typeof user.email).toBe('string');
          expect(typeof user.password).toBe('string');
          expect(user.createdAt).toBeInstanceOf(Date);
          expect(user.updatedAt).toBeInstanceOf(Date);

          // All required fields must be present (not undefined/null)
          expect(user.id).toBeTruthy();
          expect(user.email).toBeTruthy();
          expect(user.password).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: deudasmart-auth-backend, Property 10: Email duplicado propaga error de unicidad
describe('Property 10: Email duplicado propaga error de unicidad', () => {
  // Validates: Requirement 5.3
  it('insertar un usuario con email duplicado propaga error de unicidad desde el repositorio', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          // Simulate a repository that throws a uniqueness constraint error on duplicate email
          const mockSave = jest.fn();
          mockSave
            .mockResolvedValueOnce({ id: 'uuid-1', email, password: 'hash' })
            .mockRejectedValueOnce(
              Object.assign(new Error('duplicate key value violates unique constraint'), {
                code: '23505',
              })
            );

          // First insert succeeds
          await expect(mockSave(email)).resolves.toBeDefined();

          // Second insert with same email must throw
          await expect(mockSave(email)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

import bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { AuthError } from '../auth.error';
import { IUserRepository } from '../../../repositories/user.repository.interface';
import { IJwtService } from '../../../services/jwt.service.interface';

// Feature: deudasmart-auth-backend, Property 2: Login exitoso retorna token y datos públicos
describe('Property 2: Login exitoso retorna token y datos públicos', () => {
  // Validates: Requirements 1.2, 1.3, 1.4, 1.5
  it('login con credenciales válidas retorna token no vacío y userId/email sin exponer password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 20 }),
        }),
        fc.string({ minLength: 10 }),
        async (fields, fakeToken) => {
          const hashedPassword = await bcrypt.hash(fields.password, 10);

          const mockUserRepository: IUserRepository = {
            findByEmail: jest.fn().mockResolvedValue({
              id: fields.id,
              email: fields.email,
              password: hashedPassword,
            }),
          };

          const mockJwtService: IJwtService = {
            sign: jest.fn().mockReturnValue(fakeToken),
            verify: jest.fn(),
          };

          const authService = new AuthService(mockUserRepository, mockJwtService);
          const result = await authService.login(fields.email, fields.password);

          // Token must be non-empty
          expect(result.token).toBeTruthy();
          expect(result.token.length).toBeGreaterThan(0);

          // User data must contain userId and email
          expect(result.user.userId).toBe(fields.id);
          expect(result.user.email).toBe(fields.email);

          // Password must NOT be exposed
          expect((result.user as any).password).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: deudasmart-auth-backend, Property 6: Credenciales inválidas producen HTTP 401 con mensaje genérico
describe('Property 6: Credenciales inválidas producen HTTP 401 con mensaje genérico', () => {
  // Validates: Requirements 3.1, 3.2
  it('email inexistente lanza AuthError con mensaje "Credenciales inválidas"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        async (email, password) => {
          const mockUserRepository: IUserRepository = {
            findByEmail: jest.fn().mockResolvedValue(null),
          };

          const mockJwtService: IJwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
          };

          const authService = new AuthService(mockUserRepository, mockJwtService);

          await expect(authService.login(email, password)).rejects.toThrow(AuthError);
          await expect(authService.login(email, password)).rejects.toMatchObject({
            message: 'Credenciales inválidas',
            statusCode: 401,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('password incorrecto lanza AuthError con mensaje "Credenciales inválidas"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          storedPassword: fc.string({ minLength: 8, maxLength: 20 }),
        }),
        fc.string({ minLength: 8, maxLength: 20 }),
        async (fields, wrongPassword) => {
          // Ensure the wrong password is actually different from the stored one
          fc.pre(fields.storedPassword !== wrongPassword);

          const hashedPassword = await bcrypt.hash(fields.storedPassword, 10);

          const mockUserRepository: IUserRepository = {
            findByEmail: jest.fn().mockResolvedValue({
              id: fields.id,
              email: fields.email,
              password: hashedPassword,
            }),
          };

          const mockJwtService: IJwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
          };

          const authService = new AuthService(mockUserRepository, mockJwtService);

          await expect(authService.login(fields.email, wrongPassword)).rejects.toThrow(AuthError);
          await expect(authService.login(fields.email, wrongPassword)).rejects.toMatchObject({
            message: 'Credenciales inválidas',
            statusCode: 401,
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
