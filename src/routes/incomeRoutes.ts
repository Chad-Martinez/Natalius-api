import { Router } from 'express';
import {
  addIncome,
  getIncomeByUser,
  getIncomeById,
  updateIncome,
  getPaginatedIncome,
  deleteIncome,
  getIncomeAverages,
} from '../controllers/incomeController';

const router = Router();

router.get('/paginate', getPaginatedIncome);

router.get('/', getIncomeByUser);

router.get('/averages', getIncomeAverages);

router.get('/:incomeId', getIncomeById);

router.post('/', addIncome);

router.put('/', updateIncome);

router.delete('/:incomeId', deleteIncome);

export default router;
