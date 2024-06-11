import { Router } from 'express';
import { getUpcomingShifts } from '../controllers/dashboardController';

const router = Router();

router.get('/upcoming-shifts', getUpcomingShifts);

export default router;
