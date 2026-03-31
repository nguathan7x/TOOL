import { User } from '../users/user.model.js';

export class AuthRepository {
  async existsByEmail(email) {
    const existingUser = await User.findOne({ email }).select('_id').lean();
    return Boolean(existingUser);
  }

  findByEmail(email) {
    return User.findOne({ email });
  }

  findByGoogleSubject(googleSubject) {
    return User.findOne({ googleSubject });
  }

  findById(userId) {
    return User.findById(userId);
  }

  createUser(payload) {
    return User.create(payload);
  }

  save(user) {
    return user.save();
  }
}

export const authRepository = new AuthRepository();
