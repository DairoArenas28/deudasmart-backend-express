import bcrypt from 'bcrypt';
import { IUserRepository } from '../../repositories/user.repository.interface';
import { IJwtService } from '../../services/jwt.service.interface';
import { IAuthService, LoginResult } from './auth.service.interface';
import { AuthError } from './auth.error';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AuthError('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AuthError('Credenciales inválidas');
    }

    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return {
      token,
      user: { userId: user.id, email: user.email },
    };
  }
}
