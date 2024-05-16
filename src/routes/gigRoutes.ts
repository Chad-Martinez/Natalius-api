import { Router } from 'express';
import { addGig, deleteGig, getAllGigsByUser, getGigById, updateGig } from '../controllers/gigController';

const router = Router();

router.get('/user/:userId', getAllGigsByUser);

router.get('/:gigId', getGigById);

router.post('/', addGig);

router.put('/', updateGig);

router.delete('/:gigId', deleteGig);

export default router;
