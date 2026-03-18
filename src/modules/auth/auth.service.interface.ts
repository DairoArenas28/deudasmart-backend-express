export interface LoginResult {
  token: string;
  user: { userId: string; email: string };
}

export interface IAuthService {
  login(email: string, password: string): Promise<LoginResult>;
}
