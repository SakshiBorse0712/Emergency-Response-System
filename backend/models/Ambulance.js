import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Geospatial index for $geoNear queries
ambulanceSchema.index({ location: '2dsphere' });

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);
export default Ambulance;
