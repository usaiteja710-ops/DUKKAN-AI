import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Phone, Mail, MapPin, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#021024] text-slate-300 border-t border-white/10 transition-colors pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 font-black text-xl text-white group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-dukkan-azure to-dukkan-plum flex items-center justify-center text-white shadow-md">
                <Store className="w-4 h-4" />
              </div>
              <span className="tracking-tight">
                DUKKAN <span className="bg-gradient-to-r from-dukkan-azure to-dukkan-sky bg-clip-text text-transparent">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering local barbers, beauty salons, dental clinics, wellness spas, and automotive garages across India with intelligent, real-time AI scheduling.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Local Shops & Deterministic Open Slots</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-dukkan-azure" /> Explore & Book
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/shops" className="hover:text-dukkan-sky transition-colors">
                  Find Shops Near You
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-dukkan-sky transition-colors">
                  Chat with DUKKAN AI
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-dukkan-sky transition-colors">
                  Manage My Appointments
                </Link>
              </li>
              <li>
                <Link to="/signup?role=shopkeeper" className="hover:text-dukkan-sky transition-colors text-dukkan-azure font-semibold">
                  Register Your Local Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust Policies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Trust & Legal Compliance
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-dukkan-sky transition-colors">
                  Privacy Policy & DPDP Act
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-dukkan-sky transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-dukkan-sky transition-colors">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-dukkan-sky transition-colors">
                  Cookie Policy & Preferences
                </Link>
              </li>
              <li>
                <Link to="/data-deletion" className="hover:text-dukkan-sky transition-colors text-slate-400">
                  Data Deletion Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Business Details */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Contact & Support
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-dukkan-azure flex-shrink-0 mt-0.5" />
                <span>Siripuram Junction, Waltair Uplands, Visakhapatnam, AP, India - 530003</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-dukkan-azure flex-shrink-0" />
                <a href="tel:+918912345678" className="hover:text-white transition-colors font-medium">
                  +91 891 234 5678
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-dukkan-azure flex-shrink-0" />
                <a href="mailto:support@dukkan.ai" className="hover:text-white transition-colors font-medium">
                  support@dukkan.ai
                </a>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Mon - Sat: 09:00 AM - 07:00 PM IST
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Consumer Protection */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {currentYear} DUKKAN AI Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Zero Hidden Booking Fees • Pure Direct Shop Billing</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
