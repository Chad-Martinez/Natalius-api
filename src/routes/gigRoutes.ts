import { Router } from 'express';
import { addGig, deleteGig, getGigsByUser, getGigById, updateGig, getGigNames } from '../controllers/gigController';

const router = Router();

router.get('/', getGigsByUser);

router.get('/names', getGigNames);

router.get('/:gigId', getGigById);

router.post('/', addGig);

router.put('/', updateGig);

router.delete('/:gigId', deleteGig);

export default router;
