import { Router } from 'express';
import { addShift, deleteShift, getActiveShiftsByClub, getShiftById, getShiftsToComplete, updateShift } from '../controllers/shiftController';

const router = Router();

router.get('/club/:clubId', getActiveShiftsByClub);

router.get('/shifts-to-complete', getShiftsToComplete);

router.get('/:shiftId', getShiftById);

router.post('/', addShift);

router.put('/', updateShift);

router.delete('/', deleteShift);

export default router;
