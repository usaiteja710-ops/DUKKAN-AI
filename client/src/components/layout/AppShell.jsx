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
    <div className="flex flex-col min-h-screen">
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

