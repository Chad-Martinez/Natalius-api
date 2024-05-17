import { Router } from 'express';
import { addIncome, getAllIncomeByUser, getIncomeById, updateIncome, getPaginatedIncome, deleteIncome } from '../controllers/incomeController';

const router = Router();

router.get('/user/:id/paginate', getPaginatedIncome);

router.get('/user/:userId', getAllIncomeByUser);

router.get('/:incomeId', getIncomeById);

router.post('/', addIncome);

router.put('/', updateIncome);

router.delete('/:incomeId', deleteIncome);

export default router;
