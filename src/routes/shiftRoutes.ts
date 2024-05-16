import { Router } from 'express';
import { addShift, deleteShift, getAllShiftsByGig, getShiftById, updateShift } from '../controllers/shiftController';

const router = Router();

router.get('/gig/:gigId', getAllShiftsByGig);

router.get('/:shiftId', getShiftById);

router.post('/', addShift);

router.put('/', updateShift);

router.delete('/', deleteShift);

export default router;
