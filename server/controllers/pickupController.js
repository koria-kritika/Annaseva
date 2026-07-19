import FoodPost from '../models/FoodPost.js';
export const getProviderDashboard = async (req, res, next) => {
  try {
    const posts = await FoodPost.find({ provider: req.user.id })
      .populate('claimedBy', 'name phone address location')
      .select('+ngoLocationLat +ngoLocationLng')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};


export const getNgoDashboard = async (req, res, next) => {
  try {
    const posts = await FoodPost.find({ claimedBy: req.user.id })
      .populate('provider', 'name phone address location')
      .sort({ claimedAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};


export const markDelivered = async (req, res, next) => {
  try {
    const { id } = req.params;

    const foodPost = await FoodPost.findOne({ _id: id, claimedBy: req.user.id });
    if (!foodPost) {
      return res.status(404).json({ success: false, message: 'Pickup record not found' });
    }

    foodPost.status = 'delivered';
    foodPost.deliveredAt = new Date();
    await foodPost.save();

    if (req.io) {
      req.io.to('provider_room').emit('food_delivered', { foodId: id });
    }

    res.status(200).json({ success: true, data: foodPost });
  } catch (error) {
    next(error);
  }
};
