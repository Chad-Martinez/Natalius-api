import { Router } from 'express';
import { login, logout, register, verifyEmail } from '../controllers/authController';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.get('/verify/:token', verifyEmail);

router.get('/logout', logout);

export default router;
