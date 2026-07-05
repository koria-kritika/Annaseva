import Message from '../models/Message.js';
import FoodPost from '../models/FoodPost.js';


export const sendMessage = async (req, res, next) => {
  try {
    const { foodPostId, text } = req.body;
    if (!foodPostId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'foodPostId and text are required' });
    }

    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }

    
    const providerId = foodPost.provider.toString();
    const claimedById = foodPost.claimedBy?.toString();
    const senderId = req.user.id;

    if (senderId !== providerId && senderId !== claimedById) {
      return res.status(403).json({ success: false, message: 'Not authorized to chat on this post' });
    }

    const receiverId = senderId === providerId ? claimedById : providerId;
    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'No receiver found — food not yet claimed' });
    }

    const message = await Message.create({
      foodPost: foodPostId,
      sender: senderId,
      receiver: receiverId,
      text: text.trim(),
    });

    await message.populate('sender', 'name role avatar');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};


export const getMessages = async (req, res, next) => {
  try {
    const { foodPostId } = req.params;

    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }

    const providerId = foodPost.provider.toString();
    const claimedById = foodPost.claimedBy?.toString();
    const userId = req.user.id;

    if (userId !== providerId && userId !== claimedById) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ foodPost: foodPostId })
      .populate('sender', 'name role avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};