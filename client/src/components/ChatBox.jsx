// client/src/components/ChatBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ChevronDown } from 'lucide-react';
import api from '../utils/api.js';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ChatBox({ foodPostId, otherUserName, otherUserAvatar, isDelivered = false }) {
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const prevCountRef = useRef(0);

  const fetchMessages = async (silent = false) => {
    try {
      const res = await api.get(`/chat/${foodPostId}`);
      const newMsgs = res.data.data;

      if (silent) {
        
        if (newMsgs.length > prevCountRef.current) {
          const newOnes = newMsgs.slice(prevCountRef.current);
          const fromOther = newOnes.filter(
            (m) => m.sender._id !== user?.id && m.sender._id !== user?._id
          );
          if (fromOther.length > 0 && !isOpen) {
            setUnread((u) => u + fromOther.length);
          }
        }
        prevCountRef.current = newMsgs.length;
        setMessages(newMsgs);
      } else {
        prevCountRef.current = newMsgs.length;
        setMessages(newMsgs);
      }
    } catch {
      // silent fail
    }
  };

  
  useEffect(() => {
    if (!foodPostId) return;
    fetchMessages(false);
  }, [foodPostId]);

  
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!isOpen || !foodPostId) return;
    pollRef.current = setInterval(() => fetchMessages(true), 8000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, foodPostId]);

  // Scroll inside chat panel when new messages arrive
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 30);
    }
  }, [messages, isOpen]);

  
  useEffect(() => {
    if (isOpen) setUnread(0);
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/chat/send', { foodPostId, text });
      setMessages((prev) => {
        const updated = [...prev, res.data.data];
        prevCountRef.current = updated.length;
        return updated;
      });
      setText('');
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    
    <div className="relative" style={{ overflow: 'visible' }}>

      {/* Chat toggle button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 text-[11px] font-bold uppercase tracking-wider px-3 py-2 hover:border-[#FC8019] hover:text-[#FC8019] transition-colors cursor-pointer"
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <MessageCircle size={14} />
        Chat
        {/* Unread badge — rendered outside button overflow */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute bg-red-500 text-white font-black rounded-full flex items-center justify-center"
              style={{
                top: '-8px',
                right: '-8px',
                minWidth: '18px',
                height: '18px',
                fontSize: '10px',
                padding: '0 4px',
                zIndex: 10,
                lineHeight: '18px',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute bg-white border border-gray-200 shadow-2xl flex flex-col"
            style={{
              bottom: '42px',
              right: 0,
              width: '320px',
              maxHeight: '420px',
              zIndex: 100,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#FC8019] text-white shrink-0">
              <div className="flex items-center gap-2">
                {otherUserAvatar ? (
                  <img
                    src={`${API_BASE}${otherUserAvatar}`}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover border border-white/30"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-black">
                    {otherUserName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-xs font-black uppercase tracking-wider truncate max-w-[180px]">
                  {otherUserName || 'Chat'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer hover:opacity-70 transition-opacity"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F7F7F7]"
              style={{ minHeight: '200px', maxHeight: '280px' }}
            >
              {messages.length === 0 ? (
                <p className="text-center text-[11px] text-gray-400 mt-8">No messages yet. Say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender._id === user?.id || msg.sender._id === user?._id;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-black text-gray-600 mr-1.5 shrink-0 mt-1">
                          {msg.sender.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] px-3 py-2 text-xs leading-relaxed ${
                          isMine
                            ? 'bg-[#FC8019] text-white rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-lg'
                            : 'bg-white border border-gray-200 text-[#1A1A1A] rounded-tl-none rounded-tr-lg rounded-bl-lg rounded-br-lg'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-[9px] mt-0.5 ${isMine ? 'text-white/70 text-right' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {isDelivered ? (
              <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50 text-center shrink-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                   Delivered — Chat archived
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-white shrink-0"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-xs border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#FC8019] transition-colors bg-white"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="bg-[#FC8019] text-white p-2 hover:bg-[#e16f11] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send size={13} />
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}