import express from 'express';
import { triggerSOS, getEmergencies, updateEmergencyStatus } from '../controllers/emergencyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sos', protect, authorize('patient', 'admin'), triggerSOS);
router.get('/', protect, getEmergencies);
router.put('/:id/status', protect, authorize('ambulance', 'admin', 'hospital'), updateEmergencyStatus);

export default router;
