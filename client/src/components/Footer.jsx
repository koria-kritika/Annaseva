
import React from 'react';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';


const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const quickLinks = [
  { label: 'Top', id: 'dashboard-top' },
  { label: 'Explore', id: 'explore-section' },
  { label: 'Active Listings', id: 'listings-section' },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="w-full bg-[#FC8019] text-white mt-12"
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Utensils size={18} className="text-[#1A1A1A]" />
            <h2 className="text-lg font-extrabold tracking-tight">
              ANNA<span className="text-[#1A1A1A]">SEVA</span>
            </h2>
          </div>
          <p className="text-base text-white/90 leading-relaxed max-w-xs">
            Bridging surplus food from providers to communities in need — reducing waste, one plate at a time.
          </p>
        </div>

        {/* Quick links — scroll to dashboard sections */}
        <div>
          <h3 className="text-[15px] font-black uppercase tracking-widest text-white/80 mb-4">Quick Links</h3>
          <ul className="space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className="text-base font-semibold text-white hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        
        <div>
          <h3 className="text-[17px] font-black uppercase tracking-widest text-white/80 mb-4">About Us</h3>
          <p className="text-base text-white/90 leading-relaxed">
            AnnaSeva connects restaurants and food providers with NGOs to rescue surplus meals before
            they go to waste. Our mission is simple — no good food should ever be thrown away while
            someone nearby goes hungry.
          </p>
        </div>
      </div>

      <div className="border-t border-white/20 py-4 px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-white/80">© {new Date().getFullYear()} AnnaSeva. All rights reserved.</p>
        <p className="text-[11px] text-white/80">Built to fight food waste, together.</p>
      </div>
    </motion.footer>
  );
}