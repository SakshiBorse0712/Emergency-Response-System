import express from 'express';
import { updateHospitalResources, updateAmbulanceStatus } from '../controllers/resourceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/hospital', protect, authorize('hospital', 'admin'), updateHospitalResources);
router.put('/ambulance', protect, authorize('ambulance', 'admin'), updateAmbulanceStatus);

export default router;
