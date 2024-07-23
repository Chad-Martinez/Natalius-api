import { Router } from 'express';
import { login, logout, passwordResetEmail, register, resetPassword, verifyEmail } from '../controllers/authController';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.get('/verify/:token', verifyEmail);

router.post('/password-reset-email', passwordResetEmail);

router.post('/reset-password', resetPassword);

router.get('/logout', logout);

export default router;
