import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // Check for local mock role first (Development / Demo mode)
      const mockRole = localStorage.getItem('bookwise_mock_role');
      if (mockRole) {
        const storedProfileStr = localStorage.getItem('dukkan_profile_data');
        const storedProfile = storedProfileStr ? JSON.parse(storedProfileStr) : null;

        const defaultUser = {
          id: mockRole === 'shopkeeper' ? '22222222-2222-2222-2222-222222222201' : '22222222-2222-2222-2222-222222222202',
          email: `${mockRole}@dukkan.ai`,
          role: mockRole,
          full_name: mockRole === 'shopkeeper' ? 'Rajesh Sharma' : 'Priya Rao',
          phone: mockRole === 'shopkeeper' ? '+919876543210' : '+919876543211',
          avatar_url: mockRole === 'shopkeeper'
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          email_notifications: true,
        };

        const activeUser = storedProfile?.id === defaultUser.id ? { ...defaultUser, ...storedProfile } : defaultUser;

        setUser(activeUser);
        setSession({ access_token: `mock-jwt-${activeUser.id}-${mockRole}` });
        setLoading(false);
        return;
      }

      // Check real Supabase Auth
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Supabase auth session fetch warning:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await fetchUserProfile(newSession.user);
      } else if (!localStorage.getItem('bookwise_mock_role')) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(authUser) {
    try {
      const profile = await api.get('/profile');
      setUser(profile);
      localStorage.setItem('dukkan_profile_data', JSON.stringify(profile));
    } catch {
      // Fallback to user metadata
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'customer',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        phone: authUser.user_metadata?.phone || '',
        avatar_url: authUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
    }
  }

  // Sign up
  const signUp = async ({ email, password, full_name, phone, role = 'customer' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          role,
        },
      },
    });

    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user);
    }
    return data;
  };

  // Sign in
  const signIn = async ({ email, password }) => {
    localStorage.removeItem('bookwise_mock_role');
    localStorage.removeItem('bookwise_mock_jwt');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user);
    }
    return data;
  };

  // Sign out
  const signOut = async () => {
    localStorage.removeItem('bookwise_mock_role');
    localStorage.removeItem('bookwise_mock_jwt');
    localStorage.removeItem('dukkan_profile_data');
    await supabase.auth.signOut().catch(() => null);
    setUser(null);
    setSession(null);
  };

  // Switch to demo mock role (instant customer / shopkeeper testing)
  const setMockRole = (role) => {
    if (!role) {
      signOut();
      return;
    }
    const userId = role === 'shopkeeper' ? '22222222-2222-2222-2222-222222222201' : '22222222-2222-2222-2222-222222222202';
    const mockToken = `mock-jwt-${userId}-${role}`;
    localStorage.setItem('bookwise_mock_role', role);
    localStorage.setItem('bookwise_mock_jwt', mockToken);

    const mockUser = {
      id: userId,
      email: `${role}@dukkan.ai`,
      role,
      full_name: role === 'shopkeeper' ? 'Rajesh Sharma' : 'Priya Rao',
      phone: role === 'shopkeeper' ? '+919876543210' : '+919876543211',
      avatar_url: role === 'shopkeeper'
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      email_notifications: true,
    };
    setUser(mockUser);
    localStorage.setItem('dukkan_profile_data', JSON.stringify(mockUser));
    setSession({ access_token: mockToken });
  };

  const loginAsGuest = (guestData = {}) => {
    const guestId = guestData.id || `guest-${Date.now()}`;
    const guestToken = `mock-jwt-${guestId}-customer`;
    const guestUser = {
      id: guestId,
      email: guestData.email || 'customer@dukkan.ai',
      role: 'customer',
      full_name: guestData.name || 'Valued Customer',
      phone: guestData.phone || '',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      email_notifications: true,
    };
    localStorage.setItem('bookwise_mock_role', 'customer');
    localStorage.setItem('bookwise_mock_jwt', guestToken);
    localStorage.setItem('dukkan_profile_data', JSON.stringify(guestUser));
    setUser(guestUser);
    setSession({ access_token: guestToken });
    return guestUser;
  };

  const updateProfile = async (profileData) => {
    let updated;
    try {
      updated = await api.patch('/profile', profileData);
    } catch (e) {
      // In-memory update if network/api is offline
      updated = { ...user, ...profileData };
    }
    setUser((prev) => {
      const merged = { ...prev, ...updated };
      localStorage.setItem('dukkan_profile_data', JSON.stringify(merged));
      return merged;
    });
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isShopkeeper: user?.role === 'shopkeeper' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        signUp,
        signIn,
        signOut,
        setMockRole,
        loginAsGuest,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
