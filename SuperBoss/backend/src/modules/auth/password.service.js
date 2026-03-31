import bcrypt from 'bcryptjs';

export class PasswordService {
  hash(password) {
    return bcrypt.hash(password, 10);
  }

  compare(plainTextPassword, passwordHash) {
    return bcrypt.compare(plainTextPassword, passwordHash);
  }
}

export const passwordService = new PasswordService();
