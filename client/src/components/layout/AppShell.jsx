import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { ScrollProgressBar } from './ScrollProgressBar.jsx';
import { BackToTop } from './BackToTop.jsx';
import { CookieConsentBanner } from './CookieConsentBanner.jsx';
import { AssistantWidget } from '../assistant/AssistantWidget.jsx';

export function AppShell() {
  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50/50 dark:bg-[#021024] selection:bg-dukkan-azure selection:text-white transition-colors duration-300">
      {/* Global Ambient Glow Spheres using user palette */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-dukkan-azure/10 to-dukkan-sky/5 rounded-full blur-[140px] pointer-events-none -z-20" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-dukkan-plum/10 to-dukkan-dustyRose/5 rounded-full blur-[140px] pointer-events-none -z-20" />

      <ScrollProgressBar />
      <Navbar />
      <main id="main-content" className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
      <CookieConsentBanner />
      <AssistantWidget />
    </div>
  );
}
