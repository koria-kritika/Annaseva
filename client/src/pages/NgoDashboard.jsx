// client/src/pages/NgoDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, MapPin, Phone, ShieldCheck, Inbox, Sparkles, Quote, Navigation } from 'lucide-react';
import api from '../utils/api.js';
import Footer from '../components/Footer.jsx';
import ChatBox from '../components/ChatBox.jsx';

import heroBanner from '../assets/hero-banner.png';
import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';
import image5 from '../assets/image5.png';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3 } }),
};

const exploreItems = [
  { image: image1, quote: 'Every surplus meal donated helps nourish lives instead of filling landfills.', title: 'Rescue Surplus Meals' },
  { image: image2, quote: 'Help surplus food reach families and communities through trusted NGO partners.', title: 'Serve Your Community' },
  { image: image3, quote: 'Follow every donation and witness the change you are helping create.', title: 'Track Every Change' },
  { image: image4, quote: 'Empower volunteers to make a difference in their communities.', title: 'Coordinate Volunteers' },
  { image: image5, quote: 'Bring together donors and NGOs to build a reliable local food-sharing network.', title: 'Expand Your Reach' },
];

const marqueeItems = [...exploreItems, ...exploreItems];

const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Could not get location')),
      { timeout: 8000 }
    );
  });

// Opens Google Maps navigation from NGO location to provider location
const openGoogleMapsNav = (providerLat, providerLng) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${providerLat},${providerLng}&travelmode=driving`;
  window.open(url, '_blank');
};

export default function NgoDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [availableFood, setAvailableFood] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [claimingId, setClaimingId] = useState(null);
  const [deliveringId, setDeliveringId] = useState(null);
  const [newAlert, setNewAlert] = useState(false);

  const fetchAvailable = async (silent = false) => {
    try {
      const res = await api.get('/food/available');
      if (silent && res.data.data.length > availableFood.length) {
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 3000);
      }
      setAvailableFood(res.data.data);
    } catch (err) {
      console.error('Fetch available error:', err);
    }
  };

  const fetchMyPickups = async () => {
    try {
      const res = await api.get('/pickup/dashboard/ngo');
      setMyPickups(res.data.data);
    } catch (err) {
      console.error('Fetch pickups error:', err);
    }
  };

  useEffect(() => {
    fetchAvailable();
    fetchMyPickups();
    const interval = setInterval(() => { fetchAvailable(true); fetchMyPickups(); }, 10000);
    return () => clearInterval(interval);
  }, []); 

  
  const handleClaim = async (id) => {
    setClaimingId(id);
    setMessage({ text: '', type: '' });
    try {
      let ngoLat = null, ngoLng = null;
      try {
        const loc = await getCurrentLocation();
        ngoLat = loc.lat;
        ngoLng = loc.lng;
        console.log('[CLAIM] GPS captured:', { ngoLat, ngoLng });
      } catch (gpsErr) {
        console.warn('[CLAIM] GPS failed — claiming without location:', gpsErr.message);
        
      }

      console.log('[CLAIM] Sending coordinates:', { latitude: ngoLat, longitude: ngoLng });
      await api.put(`/food/claim/${id}`, {
        latitude: ngoLat,
        longitude: ngoLng,
      });

      setMessage({ text: 'Food claimed! Check "My Claims" tab for provider contact and navigation.', type: 'success' });
      fetchAvailable();
      fetchMyPickups();
      setActiveTab('tracking'); 
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to claim this batch', type: 'error' });
      fetchAvailable();
    } finally {
      setClaimingId(null);
    }
  };

  const handleDeliver = async (id) => {
    setDeliveringId(id);
    try {
      await api.put(`/pickup/deliver/${id}`);
      fetchMyPickups();
    } catch (err) {
      console.error('Deliver error:', err);
    } finally {
      setDeliveringId(null);
    }
  };

  const activeClaimsCount = myPickups.filter((p) => p.status === 'claimed').length;

  return (
    <div className="bg-[#F7F7F7] min-h-screen w-full">
      <div id="dashboard-top" className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="relative w-full h-[220px] sm:h-[280px] lg:h-[340px] mb-8 overflow-hidden shadow-lg rounded-sm"
        >
          <img src={heroBanner} alt="NGO food rescue network" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-12 max-w-xl">
            <span className="inline-block w-fit bg-[#FC8019] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-3">Bring The Change</span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-tight">Rescue Food. Restore Hope.</h1>
            <p className="text-gray-200 text-xs sm:text-sm mt-3 leading-relaxed">
              Every batch you claim here keeps good food off the landfill and on someone's plate within hours.
            </p>
          </div>
        </motion.div>

        {/* Explore Marquee */}
        <motion.div
          id="explore-section"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-10 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10"
        >
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="text-[29px] font-black text-[#FC8019] uppercase tracking-widest">Explore</span>
              <h2 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight mt-1">Why It Matters</h2>
            </div>
            <p className="hidden sm:block text-base text-gray-800 max-w-xs text-right leading-relaxed">
              Make every extra meal count by donating surplus food to organizations that deliver it where it's needed most.
            </p>
          </div>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[#F7F7F7] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[#F7F7F7] to-transparent z-10 pointer-events-none" />
            <motion.div
              className="flex gap-5 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
            >
              {marqueeItems.map((item, i) => (
                <motion.div
                  key={`${item.title}-${i}`}
                  whileHover={{ y: -6, rotate: i % 2 === 0 ? -1 : 1, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-200 w-[260px] sm:w-[300px] shrink-0"
                >
                  <img src={item.image} alt={item.title} className="w-full h-40 sm:h-44 object-cover" />
                  <div className="p-4 sm:p-5">
                    <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight mb-2">{item.title}</h3>
                    <div className="flex gap-2">
                      <Quote size={16} className="text-[#FC8019] shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 italic leading-relaxed">{item.quote}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

      
        <AnimatePresence>
          {newAlert && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-[#FC8019] text-white px-4 py-2.5 mb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> New surplus food just posted nearby!
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {message.text && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`px-4 py-3 mb-6 text-xs font-semibold border-l-4 ${message.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        
        <div className="flex border-b border-gray-200 w-full overflow-x-auto mb-6">
          {[
            { key: 'browse', label: 'Browse Food' },
            { key: 'tracking', label: `My Claims ${activeClaimsCount > 0 ? `(${activeClaimsCount})` : ''}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3.5 px-5 text-xs font-black uppercase tracking-widest relative transition-colors cursor-pointer whitespace-nowrap ${activeTab === key ? 'text-[#FC8019]' : 'text-gray-400 hover:text-[#1A1A1A]'}`}
            >
              {label}
              {activeTab === key && <motion.div layoutId="ngotab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FC8019]" />}
            </button>
          ))}
        </div>

        <div id="listings-section" />

        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {availableFood.length === 0 ? (
                <div className="bg-white border border-gray-200 p-10 sm:p-16 flex flex-col items-center text-center">
                  <Inbox size={32} className="text-gray-300 mb-3" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No food available right now</p>
                  <p className="text-xs text-gray-300 mt-1">Check back soon — providers update regularly</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {availableFood.map((item, i) => (
                    <motion.div
                      key={item._id} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                      whileHover={{ y: -4 }}
                      className="bg-white border border-gray-200 flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200"
                    >
                      {item.image ? (
                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.image}`} alt={item.title} className="w-full h-40 object-cover" />
                      ) : (
                        <div className={`h-1 w-full ${item.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="mb-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight truncate">{item.title}</h3>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 shrink-0 ${item.foodType === 'veg' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{item.foodType}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-semibold mt-0.5">by {item.provider?.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{item.description}</p>
                        <div className="mt-auto space-y-2 text-xs border-t border-gray-100 pt-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Quantity</span>
                            <span className="font-bold text-[#1A1A1A]">{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-red-600 font-semibold bg-red-50 px-2 py-1.5 border-l-2 border-red-400">
                            <Clock size={13} />
                            <span>Expires {new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-start gap-1.5 text-gray-500 text-[11px] pt-1">
                            <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{item.addressString}</span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleClaim(item._id)}
                          disabled={claimingId === item._id}
                          className="w-full mt-4 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider py-3 hover:bg-[#FC8019] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {claimingId === item._id ? 'Getting location & claiming...' : 'Claim Surplus'}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
          
            <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
              {myPickups.length === 0 ? (
                <div className="bg-white border border-gray-200 p-10 sm:p-16 flex flex-col items-center text-center">
                  <Package size={32} className="text-gray-300 mb-3" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No claims yet</p>
                  <p className="text-xs text-gray-300 mt-1">Browse available food and claim a batch</p>
                </div>
              ) : (
                myPickups.map((item, i) => (
                  <motion.div key={item._id} custom={i} variants={cardVariants} initial="hidden" animate="visible" className="bg-white border border-gray-200">
                    <div className={`h-1 w-full ${item.status === 'delivered' ? 'bg-green-500' : 'bg-[#FC8019]'}`} />
                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">{item.title}</h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${item.status === 'claimed' ? 'border-[#FC8019] text-[#FC8019] bg-orange-50' : 'border-green-500 text-green-600 bg-green-50'}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>

                        {/* Provider card */}
                        <div className="bg-gray-50 border-l-2 border-gray-300 p-3 space-y-2 text-xs">
                          {/* Provider avatar + name */}
                          <div className="flex items-center gap-2">
                            {item.provider?.avatar ? (
                              <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.provider.avatar}`}
                                alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-500">
                                {item.provider?.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#1A1A1A]">{item.provider?.name}</p>
                              <p className="text-[10px] text-gray-400">{item.provider?.phone}</p>
                            </div>
                          </div>
                         
                          {item.provider?.description && (
                            <p className="text-[11px] text-gray-500 italic leading-relaxed border-t border-gray-200 pt-2">
                              {item.provider.description}
                            </p>
                          )}
                          {/* Pickup address (entered when posting food) */}
                          <div className="flex items-start gap-1.5 text-gray-600 font-semibold">
                            <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                            <span>{item.addressString}</span>
                          </div>
                          {/* Provider original profile address */}
                          {item.provider?.address && (
                            <div className="flex items-start gap-1.5 text-gray-400 text-[11px]">
                              <Package size={11} className="text-gray-300 shrink-0 mt-0.5" />
                              <span>Based at: {item.provider.address}</span>
                            </div>
                          )}
                        </div>

                        
                        {item.location?.coordinates && (
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => openGoogleMapsNav(item.location.coordinates[1], item.location.coordinates[0])}
                            className="mt-2 flex items-center gap-2 bg-[#FC8019] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 hover:bg-[#e16f11] transition-colors cursor-pointer"
                          >
                            <Navigation size={13} /> Provider Pickup Location — Navigate
                          </motion.button>
                        )}
                       
                        <div className="mt-2">
                          <ChatBox
                            foodPostId={item._id}
                            otherUserName={item.provider?.name}
                            otherUserAvatar={item.provider?.avatar}
                            isDelivered={item.status === 'delivered'}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 w-full md:w-auto">
                        {item.status === 'claimed' ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => handleDeliver(item._id)}
                            disabled={deliveringId === item._id}
                            className="w-full md:w-auto bg-green-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {deliveringId === item._id ? 'Updating...' : 'Mark Delivered'}
                          </motion.button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-green-600 text-xs font-black uppercase tracking-widest bg-green-50 border border-green-200 px-4 py-2.5">
                            <ShieldCheck size={15} /> Distributed
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}