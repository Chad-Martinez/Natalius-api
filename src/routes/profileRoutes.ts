import { Router } from 'express';
import { getUserInfo, updateUserInfo, updatePassword } from '../controllers/profileController';

const router = Router();

router.get('/', getUserInfo);

router.put('/', updateUserInfo);

router.put('/auth', updatePassword);

export default router;
