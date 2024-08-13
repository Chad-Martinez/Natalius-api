import { Router } from 'express';
import { addSprint, deleteSprint, getActiveSprintByUser, markSprintComplete, updateSprint } from '../controllers/sprintController';

const router = Router();

router.get('/', getActiveSprintByUser);

router.post('/', addSprint);

router.post('/complete-sprint', markSprintComplete);

router.put('/', updateSprint);

router.delete('/:sprintId', deleteSprint);

export default router;
