import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const otpStore = new Map();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const isProd = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );

const setAuthCookies = (res, user) => {
  res.cookie('token', signAccessToken(user), accessCookieOptions);
  res.cookie('refreshToken', signRefreshToken(user), refreshCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'lax' });
};

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


export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, longitude, latitude } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone.trim(),
      address: address.trim(),
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 75.8577, parseFloat(latitude) || 22.7196],
      },
    });

    setAuthCookies(res, user);
    res.status(201).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please sign up first.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    setAuthCookies(res, user);
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};


export const logout = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};


export const checkAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Session expired' });
  }
};


export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    setAuthCookies(res, user);
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send email
    await transporter.sendMail({
      from: `"AnnaSeva" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'AnnaSeva — Password Reset OTP',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#FC8019;margin-bottom:8px;">AnnaSeva</h2>
          <p style="color:#374151;font-size:14px;">Your OTP for password reset:</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1A1A1A;margin:16px 0;">${otp}</div>
          <p style="color:#6b7280;font-size:12px;">Valid for 10 minutes. Do not share this with anyone.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    next(error);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }

    const record = otpStore.get(email.toLowerCase());

    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (record.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // OTP correct — update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    otpStore.delete(email.toLowerCase()); // clear used OTP

    res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    next(error);
  }
};

// GOOGLE OAUTH
export const googleAuth = async (req, res, next) => {
  try {
    const { token, role } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-12) + 'Aa1!',
        role: role === 'ngo' ? 'ngo' : 'restaurant',
        phone: '0000000000',
        address: 'Please update your address',
        googleId: sub,
        avatar: picture || '',
      });
    }

    setAuthCookies(res, user);
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
};