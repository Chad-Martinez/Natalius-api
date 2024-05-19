import { Router } from 'express';
import { addGig, deleteGig, getGigsByUser, getGigById, updateGig } from '../controllers/gigController';

const router = Router();

router.get('/', getGigsByUser);

router.get('/:gigId', getGigById);

router.post('/', addGig);

router.put('/', updateGig);

router.delete('/:gigId', deleteGig);

export default router;
