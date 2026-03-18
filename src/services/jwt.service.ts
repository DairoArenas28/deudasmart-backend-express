import jwt from 'jsonwebtoken';
import { IJwtService, JwtPayload } from './jwt.service.interface';

export class JwtService implements IJwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET ?? '';
    this.expiresIn = process.env.JWT_EXPIRES_IN ?? '24h';
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.secret);
    if (typeof decoded === 'string') {
      throw new Error('Token inválido o expirado');
    }
    return {
      userId: (decoded as JwtPayload).userId,
      email: (decoded as JwtPayload).email,
    };
  }
}
