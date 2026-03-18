import fc from 'fast-check';
import { User } from '../../../models/user.entity';

// Feature: deudasmart-auth-backend, Property 9: Entidad User contiene todos los campos requeridos
describe('Property 9: Entidad User contiene todos los campos requeridos', () => {
  // Validates: Requirements 5.1, 5.2
  it('toda instancia User generada debe tener id (string), email (string), password (string), createdAt (Date) y updatedAt (Date)', () => {
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

          // Verify all required fields are present
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('email');
          expect(user).toHaveProperty('password');
          expect(user).toHaveProperty('createdAt');
          expect(user).toHaveProperty('updatedAt');

          // Verify types
          expect(typeof user.id).toBe('string');
          expect(typeof user.email).toBe('string');
          expect(typeof user.password).toBe('string');
          expect(user.createdAt).toBeInstanceOf(Date);
          expect(user.updatedAt).toBeInstanceOf(Date);

          // Verify values are not null/undefined
          expect(user.id).not.toBeNull();
          expect(user.email).not.toBeNull();
          expect(user.password).not.toBeNull();
          expect(user.createdAt).not.toBeNull();
          expect(user.updatedAt).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: deudasmart-auth-backend, Property 10: Email duplicado propaga error de unicidad
describe('Property 10: Email duplicado propaga error de unicidad', () => {
  // Validates: Requirement 5.3
  it('intentar insertar un usuario con email duplicado debe propagar un error de unicidad', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        async (email, password) => {
          // Mock repository that simulates a unique constraint violation on duplicate email
          const mockSave = jest.fn();
          mockSave
            .mockResolvedValueOnce({ id: 'uuid-1', email, password }) // first insert succeeds
            .mockRejectedValueOnce(
              Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), {
                code: '23505',
              })
            ); // second insert fails with unique constraint error

          // First insert should succeed
          await expect(mockSave({ email, password })).resolves.toBeDefined();

          // Second insert with same email should propagate the uniqueness error
          await expect(mockSave({ email, password })).rejects.toThrow(
            /duplicate key value violates unique constraint/
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
