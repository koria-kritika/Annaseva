import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Auth from './pages/Auth.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import NgoDashboard from './pages/NgoDashboard.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Navbar from './components/Navbar.jsx';
import api from './utils/api.js';
import { authSuccess, authFailure } from './store/authSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get('/auth/me');
        dispatch(authSuccess(response.data.user));
      } catch (err) {
        dispatch(authFailure(null));
      }
    };
    fetchSession();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#FC8019] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Synchronizing Session...</p>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <Auth />
      ) : (
        <div className="min-h-screen bg-[#F5F5F5] w-full">
          <Navbar onProfileClick={() => setShowProfile(true)} />
          {showProfile ? (
            <EditProfile onBack={() => setShowProfile(false)} />
          ) : user?.role === 'restaurant' ? (
            <ProviderDashboard />
          ) : (
            <NgoDashboard />
          )}
        </div>
      )}
    </>
  );
}