import FoodPost from '../models/FoodPost.js';


export const createFoodPost = async (req, res, next) => {
  try {
    console.log('CREATE FOOD req.body:', req.body);
    console.log('CREATE FOOD req.file:', req.file);
    const { title, description, quantity, foodType, expiryTime, addressString, longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Pickup location is required' });
    }

    const foodPost = await FoodPost.create({
      provider: req.user.id,
      title,
      description,
      quantity,
      foodType,
      expiryTime: new Date(expiryTime), 
      addressString,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    if (req.io) {
      req.io.to('ngo_room').emit('new_food_posted', { message: 'New surplus food available nearby!' });
    }

    res.status(201).json({ success: true, data: foodPost });
  } catch (error) {
    console.error('CREATE FOOD ERROR:', error.message, error.errors);
    next(error);
  }
};


export const getAvailableFood = async (req, res, next) => {
  try {
    const posts = await FoodPost.find({ status: 'available', expiryTime: { $gt: new Date() } })
      .populate('provider', 'name phone address location')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};


export const claimFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { longitude, latitude } = req.body; 

    const foodPost = await FoodPost.findById(id);
    if (!foodPost) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }
    if (foodPost.status !== 'available') {
      return res.status(409).json({ success: false, message: 'This food has already been claimed' });
    }

    foodPost.status = 'claimed';
    foodPost.claimedBy = req.user.id;
    foodPost.claimedAt = new Date();

    
    if (longitude && latitude) {
      foodPost.ngoLocationLng = parseFloat(longitude);
      foodPost.ngoLocationLat = parseFloat(latitude);
    }

    await foodPost.save();

    if (req.io) {
      req.io.to('ngo_room').emit('food_claimed', { foodId: id });
      req.io.to('provider_room').emit('food_claimed', { foodId: id });
    }

    res.status(200).json({ success: true, data: foodPost });
  } catch (error) {
    next(error);
  }
};


export const getFoodForMap = async (req, res, next) => {
  try {
    const posts = await FoodPost.find({ status: 'available', expiryTime: { $gt: new Date() } })
      .populate('provider', 'name phone')
      .select('title foodType quantity location addressString expiryTime provider');

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};