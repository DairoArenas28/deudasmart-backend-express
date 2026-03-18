import { Request, Response, NextFunction } from 'express';
import { IJwtService, JwtPayload } from '../../services/jwt.service.interface';

// Extend Express Request to include user field
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
export function createAuthMiddleware(jwtService: IJwtService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token requerido' });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const payload = jwtService.verify(token);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };
}
