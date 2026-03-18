export interface LoginResponseDto {
  token: string;
  user: {
    userId: string;
    email: string;
  };
}
