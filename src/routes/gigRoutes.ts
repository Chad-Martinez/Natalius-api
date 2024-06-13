import { Router } from 'express';
import { addGig, getGigsByUser, getGigById, updateGig, getGigNames } from '../controllers/gigController';

const router = Router();

router.get('/', getGigsByUser);

router.get('/names', getGigNames);

router.get('/:gigId', getGigById);

router.post('/', addGig);

router.put('/', updateGig);

export default router;
