import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { IUserRepository } from './user.repository.interface';

export class UserRepository implements IUserRepository {
  constructor(private readonly repository: Repository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }
}
