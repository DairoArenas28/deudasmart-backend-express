import fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../auth.middleware';
import { JwtService } from '../../../services/jwt.service';
import { IJwtService, JwtPayload } from '../../../services/jwt.service.interface';

// Set test environment
process.env.JWT_SECRET = 'test-secret-for-middleware-tests';
process.env.JWT_EXPIRES_IN = '24h';

// Helper to create mock req/res/next
function createMocks(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
}

describe('AuthMiddleware', () => {
  let jwtService: JwtService;

  beforeAll(() => {
    jwtService = new JwtService();
  });

  // ─── Unit Tests (Task 10.3) ───────────────────────────────────────────────

  // Requirements: 4.1, 4.2
  it('returns HTTP 401 with "Token requerido" when Authorization header is absent', () => {
    const { req, res, next } = createMocks();
    const middleware = createAuthMiddleware(jwtService);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token requerido' });
    expect(next).not.toHaveBeenCalled();
  });

  // Requirements: 4.1, 4.2
  it('returns HTTP 401 with "Token requerido" when Authorization header has no Bearer prefix', () => {
    const { req, res, next } = createMocks('Basic sometoken');
    const middleware = createAuthMiddleware(jwtService);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token requerido' });
    expect(next).not.toHaveBeenCalled();
  });

  // Requirements: 4.3, 4.4
  it('returns HTTP 401 with "Token inválido o expirado" when token is invalid', () => {
    const { req, res, next } = createMocks('Bearer this.is.invalid');
    const middleware = createAuthMiddleware(jwtService);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  // Requirements: 4.3, 4.5
  it('calls next() and attaches payload to req.user when token is valid', () => {
    const payload: JwtPayload = { userId: 'user-123', email: 'test@example.com' };
    const token = jwtService.sign(payload);
    const { req, res, next } = createMocks(`Bearer ${token}`);
    const middleware = createAuthMiddleware(jwtService);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── Property Test (Task 10.2) ────────────────────────────────────────────

  // Feature: deudasmart-auth-backend, Property 8: Token válido adjunta payload a req.user
  // Validates: Requirement 4.5
  it('Property 8: Valid token attaches original payload to req.user', () => {
    fc.assert(
      fc.property(
        fc.record({ userId: fc.uuid(), email: fc.emailAddress() }),
        (payload) => {
          const token = jwtService.sign(payload);
          const { req, res, next } = createMocks(`Bearer ${token}`);
          const middleware = createAuthMiddleware(jwtService);

          middleware(req, res, next);

          expect(next).toHaveBeenCalled();
          expect(req.user).toBeDefined();
          expect(req.user!.userId).toBe(payload.userId);
          expect(req.user!.email).toBe(payload.email);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ─── Additional edge case ─────────────────────────────────────────────────

  it('uses injected IJwtService — verify error triggers 401', () => {
    const mockJwtService: IJwtService = {
      sign: jest.fn(),
      verify: jest.fn().mockImplementation(() => {
        throw new Error('Token expired');
      }),
    };

    const { req, res, next } = createMocks('Bearer sometoken');
    const middleware = createAuthMiddleware(mockJwtService);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });
});
