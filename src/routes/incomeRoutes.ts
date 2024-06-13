import { Router } from 'express';
import {
  addIncome,
  deleteIncome,
  updateIncome,
  getIncomeById,
  getIncomeByUser,
  getPaginatedIncome,
  getIncomeDashboardData,
} from '../controllers/incomeController';

const router = Router();

router.post('/', addIncome);

router.put('/', updateIncome);

router.get('/', getIncomeByUser);

router.get('/paginate', getPaginatedIncome);

router.get('/dashboard', getIncomeDashboardData);

router.get('/:incomeId', getIncomeById);

router.delete('/:incomeId', deleteIncome);

export default router;
