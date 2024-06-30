import { Router } from 'express';
import { addClub, getClubsByUser, getClubById, updateClub, getClubNames } from '../controllers/clubController';

const router = Router();

router.get('/', getClubsByUser);

router.get('/names', getClubNames);

router.get('/:clubId', getClubById);

router.post('/', addClub);

router.put('/', updateClub);

export default router;
