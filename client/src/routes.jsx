import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute, RoleRoute } from './components/layout/ProtectedRoute.jsx';

// Public Pages
import { Landing } from './pages/Landing.jsx';
import { Shops } from './pages/Shops.jsx';
import { ShopDetail } from './pages/ShopDetail.jsx';
import { Login } from './pages/Login.jsx';
import { Signup } from './pages/Signup.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';
import { NotFound } from './pages/NotFound.jsx';

// Legal Pages
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy.jsx';
import { TermsConditions } from './pages/legal/TermsConditions.jsx';
import { RefundPolicy } from './pages/legal/RefundPolicy.jsx';
import { CookiePolicy } from './pages/legal/CookiePolicy.jsx';
import { DataDeletion } from './pages/legal/DataDeletion.jsx';

// Customer Protected Pages
import { Book } from './pages/Book.jsx';
import { MyBookings } from './pages/MyBookings.jsx';
import { Assistant } from './pages/Assistant.jsx';
import { Profile } from './pages/Profile.jsx';

// Shopkeeper Protected Pages
import { DashboardLayout } from './pages/dashboard/DashboardLayout.jsx';
import { Overview } from './pages/dashboard/Overview.jsx';
import { Onboarding } from './pages/dashboard/Onboarding.jsx';
import { Bookings } from './pages/dashboard/Bookings.jsx';
import { Services } from './pages/dashboard/Services.jsx';
import { Schedule } from './pages/dashboard/Schedule.jsx';
import { Staff } from './pages/dashboard/Staff.jsx';
import { Customers } from './pages/dashboard/Customers.jsx';
import { Analytics } from './pages/dashboard/Analytics.jsx';
import { Settings } from './pages/dashboard/Settings.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:shopId" element={<ShopDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/assistant" element={<Assistant />} />

        {/* Legal & Compliance Routes */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/data-deletion" element={<DataDeletion />} />

        {/* Customer Protected Routes */}
        <Route
          path="/book/:shopId"
          element={<Book />}
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Shopkeeper Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={['shopkeeper', 'admin']}>
              <DashboardLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="services" element={<Services />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="staff" element={<Staff />} />
          <Route path="customers" element={<Customers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

