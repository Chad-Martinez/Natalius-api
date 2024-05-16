export interface IUser {
  email: string;
  hashedPw: string;
  firstName: string;
  lastName: string;
  isEmailVerified?: boolean;
}
