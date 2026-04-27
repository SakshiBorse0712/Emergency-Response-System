import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';

// @desc    Update hospital resources
// @route   PUT /api/resource/hospital
// @access  Private (Hospital)
export const updateHospitalResources = async (req, res) => {
  const { beds, icu, oxygen } = req.body;

  try {
    const hospital = await Hospital.findOne({ user: req.user._id });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    if (beds !== undefined) hospital.resources.beds = beds;
    if (icu !== undefined) hospital.resources.icu = icu;
    if (oxygen !== undefined) hospital.resources.oxygen = oxygen;

    await hospital.save();
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ambulance status and location
// @route   PUT /api/resource/ambulance
// @access  Private (Ambulance)
export const updateAmbulanceStatus = async (req, res) => {
  const { status, longitude, latitude } = req.body;

  try {
    const ambulance = await Ambulance.findOne({ user: req.user._id });

    if (!ambulance) {
      return res.status(404).json({ message: 'Ambulance profile not found' });
    }

    if (status !== undefined) ambulance.status = status;
    if (longitude !== undefined && latitude !== undefined) {
      ambulance.location.coordinates = [longitude, latitude];
    }

    await ambulance.save();
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
