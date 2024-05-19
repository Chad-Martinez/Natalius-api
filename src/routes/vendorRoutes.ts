import { Router } from 'express';
import { addVendor, getVendorsByUser, getVendorById, updateVendor } from '../controllers/vendorController';

const router = Router();

router.get('/', getVendorsByUser);

router.get('/:vendorId', getVendorById);

router.post('/', addVendor);

router.put('/', updateVendor);

export default router;
