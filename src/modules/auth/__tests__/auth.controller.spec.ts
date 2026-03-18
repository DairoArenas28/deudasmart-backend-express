import { Request, Response } from 'express';
import { AuthController } from '../auth.controller';
import { IAuthService, LoginResult } from '../auth.service.interface';
import { AuthError } from '../auth.error';

const mockAuthService = (): jest.Mocked<IAuthService> => ({
  login: jest.fn(),
});

const mockRequest = (body: Record<string, unknown> = {}): Partial<Request> => ({
  body,
});

const mockResponse = (): jest.Mocked<Partial<Response>> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Partial<Response>>;
};

describe('AuthController', () => {
  describe('login', () => {
    it('should return HTTP 200 with token and user data on successful login', async () => {
      // Arrange
      const authService = mockAuthService();
      const controller = new AuthController(authService);

      const loginResult: LoginResult = {
        token: 'jwt.token.here',
        user: { userId: 'user-uuid-123', email: 'user@example.com' },
      };
      authService.login.mockResolvedValue(loginResult);

      const req = mockRequest({ email: 'user@example.com', password: 'password123' });
      const res = mockResponse();

      // Act
      await controller.login(req as Request, res as Response);

      // Assert
      expect(authService.login).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'jwt.token.here',
        user: { userId: 'user-uuid-123', email: 'user@example.com' },
      });
    });

    it('should return HTTP 401 with generic message when AuthError is thrown', async () => {
      // Arrange
      const authService = mockAuthService();
      const controller = new AuthController(authService);

      authService.login.mockRejectedValue(new AuthError('Credenciales inválidas'));

      const req = mockRequest({ email: 'wrong@example.com', password: 'wrongpassword' });
      const res = mockResponse();

      // Act
      await controller.login(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
    });

    it('should return HTTP 500 with generic message when an unexpected error is thrown', async () => {
      // Arrange
      const authService = mockAuthService();
      const controller = new AuthController(authService);

      authService.login.mockRejectedValue(new Error('Database connection failed'));

      const req = mockRequest({ email: 'user@example.com', password: 'password123' });
      const res = mockResponse();

      // Act
      await controller.login(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
    });

    it('should not expose internal error details in the 500 response', async () => {
      // Arrange
      const authService = mockAuthService();
      const controller = new AuthController(authService);

      authService.login.mockRejectedValue(new Error('Sensitive DB error details'));

      const req = mockRequest({ email: 'user@example.com', password: 'password123' });
      const res = mockResponse();

      // Act
      await controller.login(req as Request, res as Response);

      // Assert
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.message).toBe('Error interno del servidor');
      expect(JSON.stringify(jsonCall)).not.toContain('Sensitive DB error details');
    });
  });
});
