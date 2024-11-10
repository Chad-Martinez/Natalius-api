import { Router } from 'express';
import { handleRefreshToken } from '../controllers/tokenController';

const router = Router();

router.get('/', handleRefreshToken);

export default router;
