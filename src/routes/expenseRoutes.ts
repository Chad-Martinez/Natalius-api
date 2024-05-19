import { Router } from 'express';
import { addExpense, deleteExpense, getExpenseById, getExpensesByUser, getPaginatedExpenses, updateExpense } from '../controllers/expenseController';

const router = Router();

router.get('/', getExpensesByUser);

router.get('/paginate', getPaginatedExpenses);

router.get('/:_id', getExpenseById);

router.post('/', addExpense);

router.put('/', updateExpense);

router.delete('/:_id', deleteExpense);

export default router;
