
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Utensils, ImagePlus, Quote, LocateFixed, Navigation, Phone, MapPin, User } from 'lucide-react';
import api from '../utils/api.js';
import Footer from '../components/Footer.jsx';
import ChatBox from '../components/ChatBox.jsx';

import heroBanner from '../assets/hero-banner.png';
import surplusIllustration from '../assets/surplus-illustration.png';
import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';
import image5 from '../assets/image5.png';

const statusStyle = {
  available: 'border-blue-400 text-blue-600 bg-blue-50',
  claimed: 'border-[#FC8019] text-[#FC8019] bg-orange-50',
  delivered: 'border-green-500 text-green-600 bg-green-50',
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3 } }),
};

const exploreItems = [
  { image: image1, quote: 'Every surplus meal donated helps nourish lives instead of filling landfills', title: 'Reduce Food Waste' },
  { image: image2, quote: 'Help surplus food reach families and communities through trusted NGO partners.', title: 'Feed Communities' },
  { image: image3, quote: 'Bring together donors and NGOs to build a reliable local food-sharing network.', title: 'Build Local Networks' },
  { image: image4, quote: 'Empower volunteers to make a difference in their communities.', title: 'Empower Volunteers' },
  { image: image5, quote: 'Follow every donation and witness the change you are helping create.', title: 'Track Real pickup' },
];

const marqueeItems = [...exploreItems, ...exploreItems];

// Gets current GPS location as a promise
const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Could not get location')),
      { timeout: 8000 }
    );
  });

export default function ProviderDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  const userCoords = user?.location?.coordinates || [75.8577, 22.7196];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    foodType: 'veg',
    expiryTime: '',
    longitude: userCoords[0].toString(),
    latitude: userCoords[1].toString(),
    addressString: '',
  });

  const fetchLogs = async () => {
    try {
      const res = await api.get('/pickup/dashboard/provider');
      setLogs(res.data.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    if (!isModalOpen) return;
    setLocating(true);
    getCurrentLocation()
      .then(async (loc) => {
        
        let addressText = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`
          );
          const data = await res.json();
          addressText = data.display_name || '';
        } catch {
          
        }
        setFormData((prev) => ({
          ...prev,
          latitude: loc.lat.toString(),
          longitude: loc.lng.toString(),
          
          addressString: prev.addressString || addressText,
        }));
        setLocationCaptured(true);
        setError('');
      })
      .catch(() => {
        setError('Location access denied. Please allow location so NGOs can navigate to you.');
      })
      .finally(() => setLocating(false));
  }, [isModalOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      quantity: '',
      foodType: 'veg',
      expiryTime: '',
      longitude: userCoords[0].toString(),
      latitude: userCoords[1].toString(),
      addressString: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setLocationCaptured(false);
  };

  
  const capturePickupLocation = async () => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      let addressText = '';
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`
        );
        const data = await res.json();
        addressText = data.display_name || '';
      } catch { /* geocoding failed silently */ }
      setFormData((prev) => ({
        ...prev,
        latitude: loc.lat.toString(),
        longitude: loc.lng.toString(),
        addressString: addressText || prev.addressString,
      }));
      setLocationCaptured(true);
    } catch {
      setError('Could not get location. Please allow location access.');
    } finally {
      setLocating(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePostFood = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + parseInt(formData.expiryTime));
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      data.set('expiryTime', expiryDate.toISOString());
      if (imageFile) data.append('image', imageFile);
      await api.post('/food/create', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsModalOpen(false);
      resetForm();
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post food');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = 'block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1';
  const inputClass = 'w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#FC8019] transition-colors bg-white';

  return (
    <div className="bg-[#F7F7F7] min-h-screen w-full">
      <div id="dashboard-top" className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="relative w-full h-[220px] sm:h-[280px] lg:h-[340px] mb-8 overflow-hidden shadow-lg rounded-sm"
        >
          <img src={heroBanner} alt="Surplus food distribution" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-12 max-w-xl">
            <span className="inline-block w-fit bg-[#FC8019] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-3">Be the one who provides</span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-tight">Turn Surplus Into Support</h1>
            <p className="text-gray-200 text-xs sm:text-sm mt-3 leading-relaxed">
              Make every extra meal count by donating surplus food to organizations that deliver it where it's needed most.
              <br /><span className="font-bold text-[#FC8019]">Every Donation Creates Impact</span>
            </p>
          </div>
        </motion.div>

        
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
              Discover how every surplus food donation reduces waste, fights hunger, and creates stronger communities
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

        
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-6 mb-8 gap-4"
        >
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-[#1A1A1A] tracking-tight uppercase">Surplus Management</h2>
            <p className="text-sm text-gray-700 mt-1 font-medium">Broadcast excess food into the local distribution network</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-[#FC8019] text-white font-bold text-xs uppercase tracking-wider py-3 px-5 flex items-center justify-center gap-2 hover:bg-[#e16f11] transition-colors cursor-pointer shadow-md shadow-orange-200"
          >
            <Plus size={15} /> Post Surplus Food
          </motion.button>
        </motion.div>

        {/* Listings */}
        <p id="listings-section" className="text-[11px] font-extrabold tracking-widest text-gray-400 uppercase mb-4">Active & Historical Batches</p>

        {logs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-200 overflow-hidden flex flex-col items-center justify-center text-center">
            <img src={surplusIllustration} alt="No surplus food posted yet" className="w-full h-auto object-cover" />
            <div className="p-6 sm:p-10 flex flex-col items-center">
              <Utensils size={28} className="text-[#FC8019] mb-3" />
              <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-wider">No food posted yet</p>
              <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">Click "Post Surplus Food" above to broadcast your first batch to local NGOs.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setIsModalOpen(true)}
                className="mt-5 bg-[#FC8019] text-white font-bold text-xs uppercase tracking-wider py-3 px-6 flex items-center gap-2 hover:bg-[#e16f11] transition-colors cursor-pointer"
              >
                <Plus size={15} /> Post Surplus Food
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {logs.map((item, i) => (
                <motion.div
                  layout key={item._id} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200"
                >
                  {item.image ? (
                    <div className="relative">
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.image}`}
                        alt={item.title} className="w-full h-40 object-cover"
                      />
                      <span className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-wide px-2 py-1 shadow ${item.foodType === 'veg' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {item.foodType === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    </div>
                  ) : (
                    <div className={`w-full h-1 ${item.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-2">
                        <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight truncate">{item.title}</h4>
                        <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 mt-1 ${item.foodType === 'veg' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                          {item.foodType}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 border shrink-0 ${statusStyle[item.status] || 'border-gray-300 text-gray-500'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{item.description}</p>
                    <div className="mt-auto border-t border-gray-100 pt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quantity</span>
                        <span className="font-bold text-[#1A1A1A]">{item.quantity}</span>
                      </div>
                      {item.claimedBy && (
                        <div className="bg-gray-50 p-3 border-l-2 border-[#FC8019] mt-2 space-y-2">
                          <span className="text-[10px] font-black text-[#FC8019] uppercase tracking-widest">Claimed by NGO</span>
                          
                          <div className="flex items-center gap-2">
                            {item.claimedBy.avatar ? (
                              <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.claimedBy.avatar}`}
                                alt="" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-xs font-black text-[#FC8019]">
                                {item.claimedBy.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-[#1A1A1A]">{item.claimedBy.name}</p>
                              <p className="text-[10px] text-gray-400">{item.claimedBy.phone}</p>
                            </div>
                          </div>
                          
                          {item.claimedBy.description && (
                            <p className="text-[11px] text-gray-500 italic leading-relaxed border-t border-gray-200 pt-2">
                              {item.claimedBy.description}
                            </p>
                          )}
                          {item.claimedBy.address && (
                            <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                              <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
                              <span>{item.claimedBy.address}</span>
                            </div>
                          )}
                         
                          {item.ngoLocationLat && item.ngoLocationLng ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              onClick={() => window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${item.ngoLocationLat},${item.ngoLocationLng}&travelmode=driving`,
                                '_blank'
                              )}
                              className="w-full flex items-center justify-center gap-1.5 bg-[#FC8019] text-white text-[10px] font-bold uppercase tracking-wider py-2 hover:bg-[#e16f11] transition-colors cursor-pointer"
                            >
                              <Navigation size={11} /> Claimer Location — Navigate
                            </motion.button>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">NGO live location not shared</p>
                          )}
                          
                          <div className="pt-1">
                            <ChatBox
                              foodPostId={item._id}
                              otherUserName={item.claimedBy.name}
                              otherUserAvatar={item.claimedBy.avatar}
                              isDelivered={item.status === 'delivered'}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                className="bg-white border-t-4 border-[#FC8019] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight">Post Excess Food</h3>
                    <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-[#1A1A1A] cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  {error && <div className="text-xs bg-red-50 text-red-600 px-3 py-2 mb-4 border-l-2 border-red-500">{error}</div>}

                  <form onSubmit={handlePostFood} className="space-y-4">
                   
                    <div>
                      <label className={labelClass}>Food Photo</label>
                      <label htmlFor="foodImage" className="w-full h-36 border-2 border-dashed border-gray-300 hover:border-[#FC8019] flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-gray-50">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <><ImagePlus size={24} className="text-gray-400 mb-1" /><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Click to upload photo</span></>
                        )}
                      </label>
                      <input id="foodImage" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>

                    <div>
                      <label className={labelClass}>Food Title</label>
                      <input type="text" required placeholder="e.g., Biryani / Roti Sabzi" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea required rows={2} placeholder="Describe dishes, condition, storage..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Quantity</label>
                        <input type="text" required placeholder="e.g., 15 KG / 30 Plates" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Freshness (Hours)</label>
                        <input type="number" required min={1} placeholder="Hours" value={formData.expiryTime} onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })} className={inputClass} />
                      </div>
                    </div>

                    
                    <div>
                      <label className={labelClass}>Food Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'veg', label: '🟢 Veg', active: 'border-green-600 text-green-700 bg-green-50' },
                          { value: 'non-veg', label: '🔴 Non-Veg', active: 'border-red-600 text-red-700 bg-red-50' },
                        ].map(({ value, label, active }) => (
                          <label key={value} className={`border px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${formData.foodType === value ? active : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                            <input type="radio" name="foodType" value={value} checked={formData.foodType === value} onChange={() => setFormData({ ...formData, foodType: value })} className="hidden" />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Pickup Address (text)</label>
                      <input type="text" required placeholder="Floor, gate, landmarks" value={formData.addressString} onChange={(e) => setFormData({ ...formData, addressString: e.target.value })} className={inputClass} />
                    </div>

                   
                    <div>
                      <label className={labelClass}>Pickup GPS Location</label>
                      <button
                        type="button"
                        onClick={capturePickupLocation}
                        className={`w-full flex items-center justify-center gap-2 border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          locationCaptured
                            ? 'border-green-500 text-green-600 bg-green-50'
                            : 'border-gray-300 text-gray-500 hover:border-[#FC8019] hover:text-[#FC8019]'
                        }`}
                      >
                        <LocateFixed size={14} className={locating ? 'animate-spin' : ''} />
                        {locationCaptured ? '✓ Location captured for NGO navigation' : locating ? 'Getting location...' : 'Set my current location as pickup point'}
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1">NGOs will use this to navigate to you on Google Maps</p>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 border border-gray-300 text-gray-500 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                      <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting} className="flex-1 bg-[#FC8019] text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#e16f11] transition-colors disabled:opacity-60 cursor-pointer">
                        {isSubmitting ? 'Posting...' : 'Broadcast'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}