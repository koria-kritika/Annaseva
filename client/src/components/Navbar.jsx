import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { LogOut, User, MapPin } from 'lucide-react';
import api from '../utils/api.js';
import { logoutSuccess } from '../store/authSlice.js';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function Navbar({ onProfileClick }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      dispatch(logoutSuccess());
    }
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm"
    >
      <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
            ANNA<span className="text-[#FC8019]">SEVA</span>
          </h1>
          {user?.address && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-200 pl-6">
              <MapPin size={14} className="text-[#FC8019]" />
              <span className="text-gray-600 truncate max-w-[200px]">{user.address.split(',')[0]}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
         
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onProfileClick}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full border-2 border-orange-200 group-hover:border-[#FC8019] transition-colors overflow-hidden shrink-0 bg-orange-50 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={`${API_BASE}${user.avatar}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-black text-[#FC8019]">
                  {user?.name?.[0]?.toUpperCase() || <User size={16} className="text-[#FC8019]" />}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1A1A1A] leading-tight group-hover:text-[#FC8019] transition-colors">
                {user?.name}
              </p>
              <p className="text-[10px] font-bold text-[#FC8019] uppercase tracking-wider mt-0.5">
                {user?.role === 'restaurant' ? 'Provider' : 'NGO'}
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="flex items-center gap-2 border border-[#1A1A1A] px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}