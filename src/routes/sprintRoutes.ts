import { Router } from 'express';
import { addSprint, deleteSprint, getActiveSprintByUser, updateSprint } from '../controllers/sprintController';

const router = Router();

router.get('/', getActiveSprintByUser);

router.post('/', addSprint);

router.put('/', updateSprint);

router.delete('/:sprintId', deleteSprint);

export default router;
