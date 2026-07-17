import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  location: user.location,
  avatar: user.avatar,
  description: user.description,
});

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, description, role } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Name, phone, and address are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldRole = user.role;

    user.name = name.trim();
    user.phone = phone.trim();
    user.address = address.trim();
    user.description = description?.trim() || '';

    // Role change — only allow switching between restaurant and ngo
    if (role && ['restaurant', 'ngo'].includes(role)) {
      user.role = role;
    }

    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // Agar role change hua — nayi JWT cookies set karo with updated role
    if (role && role !== oldRole) {
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      };
      const refreshOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      };
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
        { expiresIn: '7d' }
      );
      res.cookie('token', accessToken, cookieOptions);
      res.cookie('refreshToken', refreshToken, refreshOptions);
    }

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};
