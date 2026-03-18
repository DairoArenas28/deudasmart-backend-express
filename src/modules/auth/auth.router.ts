import { Router } from 'express';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import { JwtService } from '../../services/jwt.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { loginValidator } from './auth.validator';

const router = Router();

// Dependency injection
const typeormRepository = AppDataSource.getRepository(User);
const userRepository = new UserRepository(typeormRepository);
const jwtService = new JwtService();
const authService = new AuthService(userRepository, jwtService);
const controller = new AuthController(authService);

// Routes
// POST /login — Requirements: 1.1, 2.1, 2.2, 2.3, 2.4
router.post('/login', [...loginValidator, controller.login]);

export default router;
