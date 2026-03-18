import { Request, Response } from 'express';
import { IAuthService } from './auth.service.interface';
import { AuthError } from './auth.error';
import { LoginResponseDto } from './dto/login.response.dto';

export class AuthController {
  constructor(private readonly authService: IAuthService) {
    this.login = this.login.bind(this);
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      const response: LoginResponseDto = {
        token: result.token,
        user: {
          userId: result.user.userId,
          email: result.user.email,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({ message: 'Credenciales inválidas' });
      } else {
        res.status(500).json({ message: 'Error interno del servidor' });
      }
    }
  }
}
