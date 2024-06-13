import { Router } from 'express';
import { addShift, deleteShift, getActiveShiftsByGig, getShiftById, updateShift } from '../controllers/shiftController';

const router = Router();

router.get('/gig/:gigId', getActiveShiftsByGig);

router.get('/:shiftId', getShiftById);

router.post('/', addShift);

router.put('/', updateShift);

router.delete('/', deleteShift);

export default router;
