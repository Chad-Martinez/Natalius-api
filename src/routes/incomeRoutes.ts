import { Router } from 'express';
import { getPaginatedIncome, getIncomeDashboardData } from '../controllers/incomeController';

const router = Router();

router.get('/paginate', getPaginatedIncome);

router.get('/dashboard', getIncomeDashboardData);

export default router;
