import EmergencyRequest from '../models/EmergencyRequest.js';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';

// @desc    Trigger an SOS request
// @route   POST /api/emergency/sos
// @access  Private (Patient)
export const triggerSOS = async (req, res) => {
  const { longitude, latitude, emergencyType } = req.body;

  try {
    // 1. Find nearest hospital with beds available using $geoNear
    const hospitals = await Hospital.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'dist.calculated',
          maxDistance: 50000, // 50km radius
          query: { 'resources.beds': { $gt: 0 } },
          spherical: true,
        },
      },
      { $limit: 1 }
    ]);

    const nearestHospital = hospitals.length > 0 ? hospitals[0] : null;

    if (!nearestHospital) {
      return res.status(404).json({ message: 'No hospitals with available beds found nearby.' });
    }

    // 2. Find nearest available ambulance
    const ambulances = await Ambulance.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'dist.calculated',
          maxDistance: 50000,
          query: { status: 'available' },
          spherical: true,
        },
      },
      { $limit: 1 }
    ]);

    const nearestAmbulance = ambulances.length > 0 ? ambulances[0] : null;

    if (!nearestAmbulance) {
      return res.status(404).json({ message: 'No available ambulances found nearby.' });
    }

    // 3. Create Emergency Request
    const emergencyRequest = await EmergencyRequest.create({
      patient: req.user._id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      emergencyType: emergencyType || 'general',
      hospital: nearestHospital ? nearestHospital._id : null,
      ambulance: nearestAmbulance ? nearestAmbulance._id : null,
      status: nearestAmbulance ? 'assigned' : 'pending'
    });

    // If an ambulance is assigned, update its status
    if (nearestAmbulance) {
      await Ambulance.findByIdAndUpdate(nearestAmbulance._id, { status: 'busy' });
    }

    // 4. Notify hospital and patient via Socket.io
    const reqPopulated = await EmergencyRequest.findById(emergencyRequest._id)
      .populate('patient', 'name phone')
      .populate('hospital', 'address location resources')
      .populate('ambulance', 'vehicleNumber location status');

    const io = req.app.get('socketio');
    
    // Notify the specific hospital room
    if (nearestHospital) {
      io.to(nearestHospital._id.toString()).emit('new_emergency', {
        emergencyRequest: reqPopulated
      });
    }

    // Notify the specific emergency room (patient is listening)
    io.to(emergencyRequest._id.toString()).emit('receive_status_update', {
      status: emergencyRequest.status
    });

    res.status(201).json({
      message: 'SOS Triggered',
      emergencyRequest: reqPopulated,
      assignedHospital: nearestHospital,
      assignedAmbulance: nearestAmbulance,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get emergency requests for a user/hospital/ambulance
// @route   GET /api/emergency
// @access  Private
export const getEmergencies = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole === 'patient') {
      query = { patient: req.user._id };
    } else if (userRole === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if(hospital) query = { hospital: hospital._id };
      else return res.status(404).json({ message: "Hospital not found" });
    } else if (userRole === 'ambulance') {
      const ambulance = await Ambulance.findOne({ user: req.user._id });
      if(ambulance) query = { ambulance: ambulance._id, status: { $in: ['assigned', 'en_route', 'arrived'] } };
      else return res.status(404).json({ message: "Ambulance not found" });
    }
    // admin gets all

    const requests = await EmergencyRequest.find(query)
      .populate('patient', 'name phone')
      .populate('hospital', 'address location resources')
      .populate('ambulance', 'vehicleNumber location status')
      .sort('-createdAt');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update emergency status
// @route   PUT /api/emergency/:id/status
// @access  Private
export const updateEmergencyStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const emergency = await EmergencyRequest.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    emergency.status = status;
    await emergency.save();

    // If completed or cancelled, free up the ambulance
    if ((status === 'completed' || status === 'cancelled') && emergency.ambulance) {
      await Ambulance.findByIdAndUpdate(emergency.ambulance, { status: 'available' });
    }

    // Notify involved parties via socket
    const io = req.app.get('socketio');
    io.to(emergency._id.toString()).emit('receive_status_update', { status });

    res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
