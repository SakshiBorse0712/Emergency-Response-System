import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
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
    resources: {
      beds: { type: Number, default: 0 },
      icu: { type: Number, default: 0 },
      oxygen: { type: Number, default: 0 },
    },
    address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Geospatial index for $geoNear queries
hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
