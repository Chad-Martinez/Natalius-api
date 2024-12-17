export interface IUser {
  email: string;
  hashedPw: string;
  stageName: string;
  isEmailVerified?: boolean;
  refreshTokens: Array<String>;
}
