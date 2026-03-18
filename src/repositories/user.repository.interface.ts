import { User } from '../models/user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
}
