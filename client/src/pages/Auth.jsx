import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Phone, MapPin, Building,
  AlertCircle, UserPlus, Eye, EyeOff, KeyRound, CheckCircle2,
} from 'lucide-react';
import api from '../utils/api.js';
import { authStart, authSuccess, authFailure, clearError } from '../store/authSlice.js';
import logo from '../assets/logo.png';

const baseInputClass =
  'w-full border border-gray-300 py-3 text-sm focus:outline-none focus:border-[#FC8019] transition-colors bg-white';


function InputField({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
      <input className={`${baseInputClass} pl-10 pr-4`} {...props} />
    </div>
  );
}


function PasswordField({ icon: Icon = Lock, value, onChange, placeholder, name, required, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={`${baseInputClass} pl-10 pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FC8019] transition-colors cursor-pointer"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const fadeSlide = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
};

const getSilentLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 6000 }
    );
  });



export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotStep, setForgotStep] = useState(null); // null | 'email' | 'otp' | 'done'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const gsiInitialized = useRef(false);
  const handleGoogleResponseRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'restaurant',
    phone: '', address: '', latitude: '22.7196', longitude: '75.8577',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        dispatch(authSuccess(response.data.user));
      } else {
        const loc = await getSilentLocation();
        const payload = {
          ...formData,
          latitude: loc ? loc.lat.toString() : formData.latitude,
          longitude: loc ? loc.lng.toString() : formData.longitude,
        };
        const response = await api.post('/auth/register', payload);
        dispatch(authSuccess(response.data.user));
      }
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Something went wrong'));
    }
  };

  handleGoogleResponseRef.current = async (googleAuthData) => {
    dispatch(authStart());
    try {
      const loc = await getSilentLocation();
      const response = await api.post('/auth/google', {
        token: googleAuthData.credential,
        role: formData.role,
        latitude: loc ? loc.lat.toString() : '22.7196',
        longitude: loc ? loc.lng.toString() : '75.8577',
      });
      dispatch(authSuccess(response.data.user));
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Google login failed'));
    }
  };

  useEffect(() => {
    if (typeof google === 'undefined' || gsiInitialized.current) return;
    gsiInitialized.current = true;
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (data) => handleGoogleResponseRef.current(data),
    });
    google.accounts.id.renderButton(document.getElementById('googleSignInBtn'), {
      theme: 'outline', size: 'large', width: 400, text: 'continue_with',
    });
  }, []);

  const switchTab = (login) => {
    setIsLogin(login);
    setForgotStep(null);
    dispatch(clearError());
    setFormData({
      name: '', email: '', password: '', role: 'restaurant',
      phone: '', address: '', latitude: '22.7196', longitude: '75.8577',
    });
  };

  // ── Forgot password handlers ──────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-otp', { email: forgotEmail });
      setForgotMsg('OTP sent! Check your email.');
      setForgotStep('otp');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      });
      setForgotStep('done');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const exitForgot = () => {
    setForgotStep(null);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotError('');
    setForgotMsg('');
  };
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-gray-200 shadow-xl relative overflow-hidden"
      >
        <div className="h-1.5 bg-[#FC8019] w-full" />

        <div className="p-5 sm:p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
            <img src={logo} alt="AnnaSeva Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0" />
            <div className="flex flex-col leading-tight">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
                ANNA<span className="text-[#FC8019]">SEVA</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Bridge to Surplus Food
              </p>
            </div>
          </div>

          {/* ══════════════ FORGOT PASSWORD FLOW ══════════════ */}
          <AnimatePresence mode="wait">
            {forgotStep ? (
              <motion.div key="forgot" {...fadeSlide}>
                {/* Step: email */}
                {forgotStep === 'email' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider mb-1">Forgot Password</p>
                      <p className="text-[11px] text-gray-400">Enter your registered email. We'll send a 6-digit OTP.</p>
                    </div>
                    {forgotError && (
                      <div className="bg-red-50 text-red-600 px-3 py-2 text-xs font-semibold flex items-center gap-2 border-l-4 border-red-500">
                        <AlertCircle size={14} className="shrink-0" /> {forgotError}
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                      <input
                        type="email"
                        required
                        placeholder="Registered email address"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className={`${baseInputClass} pl-10 pr-4`}
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-[#FC8019] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#e16f11] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : 'Send OTP'}
                    </motion.button>
                    <button type="button" onClick={exitForgot} className="w-full text-[11px] text-gray-400 hover:text-[#FC8019] transition-colors cursor-pointer">
                      ← Back to Login
                    </button>
                  </form>
                )}

                {/* Step: otp + new password */}
                {forgotStep === 'otp' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider mb-1">Enter OTP</p>
                      {forgotMsg && (
                        <p className="text-[11px] text-green-600 font-semibold">{forgotMsg}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">OTP sent to <span className="font-bold text-[#1A1A1A]">{forgotEmail}</span></p>
                    </div>
                    {forgotError && (
                      <div className="bg-red-50 text-red-600 px-3 py-2 text-xs font-semibold flex items-center gap-2 border-l-4 border-red-500">
                        <AlertCircle size={14} className="shrink-0" /> {forgotError}
                      </div>
                    )}
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit OTP"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        className={`${baseInputClass} pl-10 pr-4 tracking-[0.4em] font-bold text-center`}
                      />
                    </div>
                    <PasswordField
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="New password (min 6 characters)"
                      required
                      minLength={6}
                    />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-[#FC8019] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#e16f11] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Resetting...
                        </span>
                      ) : 'Reset Password'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => { setForgotStep('email'); setForgotError(''); }}
                      className="w-full text-[11px] text-gray-400 hover:text-[#FC8019] transition-colors cursor-pointer"
                    >
                      ← Resend / Change email
                    </button>
                  </form>
                )}

                {/* Step: done */}
                {forgotStep === 'done' && (
                  <motion.div {...fadeSlide} className="flex flex-col items-center text-center gap-4 py-4">
                    <CheckCircle2 size={44} className="text-green-500" />
                    <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-wider">Password Reset!</p>
                    <p className="text-xs text-gray-400">You can now login with your new password.</p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={exitForgot}
                      className="bg-[#FC8019] text-white py-3 px-8 text-xs font-bold uppercase tracking-widest hover:bg-[#e16f11] transition-colors cursor-pointer"
                    >
                      Back to Login
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              // ══════════════ NORMAL LOGIN / SIGNUP ══════════════
              <motion.div key="auth" {...fadeSlide}>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 relative">
                  {['Login', 'Sign Up'].map((label, i) => {
                    const active = i === 0 ? isLogin : !isLogin;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => switchTab(i === 0)}
                        className={`flex-1 pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
                          active ? 'text-[#FC8019]' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {label}
                        {active && (
                          <motion.div layoutId="authTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FC8019]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 px-3 py-2.5 mb-4 text-xs font-semibold flex items-center gap-2 border-l-4 border-red-500"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span>
                        {error}
                        {/* Signup nudge when user not found */}
                        {error.toLowerCase().includes('does not exist') && (
                          <button
                            type="button"
                            onClick={() => switchTab(false)}
                            className="ml-1 underline font-bold hover:text-red-800 cursor-pointer"
                          >
                            Sign up here →
                          </button>
                        )}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <AnimatePresence mode="wait">
                    {isLogin ? (
                      <motion.div key="login" className="space-y-3" {...fadeSlide}>
                        <InputField icon={Mail} type="email" name="email" required placeholder="Email address" value={formData.email} onChange={handleInputChange} />
                        <PasswordField
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password"
                          required
                        />
                        {/* Forgot password link */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => { setForgotEmail(formData.email); setForgotStep('email'); dispatch(clearError()); }}
                            className="text-[11px] text-gray-400 hover:text-[#FC8019] transition-colors cursor-pointer font-semibold"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="signup" className="space-y-3 max-h-[55vh] sm:max-h-[380px] overflow-y-auto pr-1" {...fadeSlide}>
                        <InputField icon={User} type="text" name="name" required placeholder="Full name" value={formData.name} onChange={handleInputChange} />
                        <InputField icon={Mail} type="email" name="email" required placeholder="Email address" value={formData.email} onChange={handleInputChange} />
                        <PasswordField
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password (min 6 characters)"
                          required
                          minLength={6}
                        />
                        <InputField icon={Phone} type="text" name="phone" required placeholder="Contact number" value={formData.phone} onChange={handleInputChange} />
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-gray-400" size={17} />
                          <textarea
                            name="address"
                            required
                            rows={2}
                            placeholder="Full address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] transition-colors resize-none bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'restaurant', label: 'Provider', Icon: Building },
                            { value: 'ngo', label: 'NGO', Icon: UserPlus },
                          ].map(({ value, label, Icon }) => (
                            <label
                              key={value}
                              className={`border p-3 flex items-center gap-2 cursor-pointer transition-colors ${
                                formData.role === value
                                  ? 'border-[#FC8019] text-[#FC8019] bg-orange-50/30'
                                  : 'border-gray-300 text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              <input type="radio" name="role" value={value} checked={formData.role === value} onChange={handleInputChange} className="hidden" />
                              <Icon size={15} />
                              <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">
                          📍 Your location will be auto-detected on signup for local matching
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#FC8019] text-white py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#e16f11] transition-colors mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : isLogin ? 'Access Account' : 'Create Account'}
                  </motion.button>
                </form>

                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">or</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                <div id="googleSignInBtn" className="flex justify-center overflow-x-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}