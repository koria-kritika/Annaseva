import mongoose from 'mongoose';

const foodPostSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    quantity: { type: String, required: [true, 'Quantity is required'] },
    foodType: { type: String, enum: ['veg', 'non-veg'], required: true },
    image: { type: String, default: '' },
    expiryTime: { type: Date, required: [true, 'Expiry time is required'] },
    addressString: { type: String, required: [true, 'Pickup address is required'] },

    
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    status: {
      type: String,
      enum: ['available', 'claimed', 'delivered', 'expired'],
      default: 'available',
    },

    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    claimedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    
    ngoLocationLat: { type: Number, default: null },
    ngoLocationLng: { type: Number, default: null },
  },
  { timestamps: true }
);

foodPostSchema.index({ location: '2dsphere' });

const FoodPost = mongoose.model('FoodPost', foodPostSchema);
export default FoodPost;