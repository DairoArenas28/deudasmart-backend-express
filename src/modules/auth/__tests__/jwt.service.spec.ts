import fc from 'fast-check';
import { JwtService } from '../../../services/jwt.service';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '24h';
});

// Feature: deudasmart-auth-backend, Property 1: Round-trip de JWT
describe('Property 1: Round-trip de JWT', () => {
  // Validates: Requirements 1.4, 4.5
  it('JWT sign/verify round-trip preserva userId y email del payload original', () => {
    const jwtService = new JwtService();

    fc.assert(
      fc.property(
        fc.record({ userId: fc.uuid(), email: fc.emailAddress() }),
        (payload) => {
          const token = jwtService.sign(payload);
          const decoded = jwtService.verify(token);
          expect(decoded.userId).toBe(payload.userId);
          expect(decoded.email).toBe(payload.email);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: deudasmart-auth-backend, Property 7: Token inválido o expirado produce HTTP 401
describe('Property 7: Token inválido o expirado produce error en verify()', () => {
  // Validates: Requirement 4.4
  it('strings aleatorios que no son JWTs válidos deben lanzar error en verify()', () => {
    const jwtService = new JwtService();

    fc.assert(
      fc.property(
        // Generate strings that are NOT valid JWTs (valid JWTs have 3 base64url parts separated by dots)
        fc.string({ minLength: 1 }).filter((s) => {
          // Exclude strings that happen to be valid JWT format (3 dot-separated parts)
          const parts = s.split('.');
          return parts.length !== 3;
        }),
        (invalidToken) => {
          expect(() => jwtService.verify(invalidToken)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
