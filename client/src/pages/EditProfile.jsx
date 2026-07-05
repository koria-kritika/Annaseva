// client/src/pages/EditProfile.jsx
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, ArrowLeft, AlertCircle, CheckCircle2, Camera, FileText } from 'lucide-react';
import api from '../utils/api.js';
import { authSuccess } from '../store/authSlice.js';

const inputClass =
  'w-full border border-gray-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] transition-colors bg-white';

function InputField({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
      <input className={inputClass} {...props} />
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function EditProfile({ onBack }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    description: user?.description || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `${API_BASE}${user.avatar}` : null
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('address', formData.address);
      data.append('description', formData.description);
      if (avatarFile) data.append('avatar', avatarFile);

      const response = await api.put('/user/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(authSuccess(response.data.user));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] w-full">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 hover:text-[#FC8019] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white border border-gray-200 shadow-xl overflow-hidden"
        >
          <div className="h-1.5 bg-[#FC8019] w-full" />

          <div className="p-6 sm:p-8">
            {/* Avatar upload */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-orange-50 border-2 border-[#FC8019] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-[#FC8019]">
                      {formData.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FC8019] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e16f11] transition-colors"
                >
                  <Camera size={13} className="text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">Edit Profile</h1>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {user?.role === 'restaurant' ? 'Provider Account' : 'NGO Account'} · {user?.email}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Click photo to change</p>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 px-3 py-2.5 mb-4 text-xs font-semibold flex items-center gap-2 border-l-4 border-red-500"
                >
                  <AlertCircle size={15} /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 text-green-700 px-3 py-2.5 mb-4 text-xs font-semibold flex items-center gap-2 border-l-4 border-green-500"
                >
                  <CheckCircle2 size={15} /> Profile updated successfully
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <InputField icon={User} type="text" name="name" required placeholder="Your full name" value={formData.name} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                <InputField icon={Phone} type="text" name="phone" required placeholder="Phone number" value={formData.phone} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={17} />
                  <textarea
                    name="address"
                    required
                    rows={2}
                    placeholder="Full address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] transition-colors resize-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  About / Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={17} />
                  <textarea
                    name="description"
                    rows={3}
                    placeholder={
                      user?.role === 'restaurant'
                        ? 'Tell NGOs about your restaurant — cuisine, capacity, typical surplus...'
                        : 'Tell providers about your NGO — mission, area served, beneficiaries...'
                    }
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] transition-colors resize-none bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 border border-gray-300 text-gray-500 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#FC8019] text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#e16f11] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}