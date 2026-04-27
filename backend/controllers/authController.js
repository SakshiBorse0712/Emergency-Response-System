import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, role, phone, extraData } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
    });

    if (user) {
      // Create associated role document
      if (role === 'hospital' && extraData) {
        await Hospital.create({
          user: user._id,
          location: {
            type: 'Point',
            coordinates: [extraData.longitude, extraData.latitude],
          },
          address: extraData.address,
          resources: { beds: 10, icu: 5, oxygen: 20 } // Add default resources for testing
        });
      } else if (role === 'ambulance' && extraData) {
        await Ambulance.create({
          user: user._id,
          location: {
            type: 'Point',
            coordinates: [extraData.longitude, extraData.latitude],
          },
          vehicleNumber: extraData.vehicleNumber,
          status: 'available' // Set to available by default for testing
        });
      }

      const token = generateToken(res, user._id);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(res, user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let profileData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      };

      if (user.role === 'hospital') {
        const hospital = await Hospital.findOne({ user: user._id });
        if(hospital) profileData.hospitalDetails = hospital;
      } else if (user.role === 'ambulance') {
        const ambulance = await Ambulance.findOne({ user: user._id });
        if(ambulance) profileData.ambulanceDetails = ambulance;
      }

      res.json(profileData);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
