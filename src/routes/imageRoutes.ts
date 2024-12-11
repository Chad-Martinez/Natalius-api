import { Router } from 'express';
import { addImage, deleteImage } from '../controllers/imageController';
import multer from 'multer';

const image = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post('/', image.single('image'), addImage);

router.delete('/', deleteImage);

export default router;
