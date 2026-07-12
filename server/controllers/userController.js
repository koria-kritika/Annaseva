// import User from '../models/User.js';

// const formatUser = (user) => ({
//   id: user._id,
//   name: user.name,
//   email: user.email,
//   role: user.role,
//   phone: user.phone,
//   address: user.address,
//   location: user.location,
//   avatar: user.avatar,
//   description: user.description,
// });


// export const updateProfile = async (req, res, next) => {
//   try {
//     const { name, phone, address, description } = req.body;

//     if (!name || !phone || !address) {
//       return res.status(400).json({ success: false, message: 'Name, phone, and address are required' });
//     }

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     user.name = name.trim();
//     user.phone = phone.trim();
//     user.address = address.trim();
//     user.description = description?.trim() || '';

  
//     if (req.file) {
//       user.avatar = `/uploads/${req.file.filename}`;
//     }

//     await user.save();
//     res.status(200).json({ success: true, user: formatUser(user) });
//   } catch (error) {
//     next(error);
//   }
// };

import User from '../models/User.js';

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
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};