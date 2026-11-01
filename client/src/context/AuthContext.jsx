import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/apiClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // Check for mock session first (demo/test support)
      const mockRole = localStorage.getItem('bookwise_mock_role');
      if (mockRole) {
        const mockUser = {
          id: mockRole === 'shopkeeper' ? '22222222-2222-2222-2222-222222222201' : '22222222-2222-2222-2222-222222222202',
          email: `${mockRole}@bookwise.local`,
          role: mockRole,
          full_name: mockRole === 'shopkeeper' ? 'Rajesh Sharma' : 'Priya Rao',
          phone: mockRole === 'shopkeeper' ? '+919876543210' : '+919876543211',
        };
        setUser(mockUser);
        setSession({ access_token: `mock-jwt-${mockUser.id}-${mockRole}` });
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
    } catch {
      // Fallback to user metadata
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'customer',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
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
      email: `${role}@bookwise.local`,
      role,
      full_name: role === 'shopkeeper' ? 'Rajesh Sharma' : 'Priya Rao',
      phone: role === 'shopkeeper' ? '+919876543210' : '+919876543211',
    };
    setUser(mockUser);
    setSession({ access_token: mockToken });
  };

  const updateProfile = async (profileData) => {
    const updated = await api.patch('/profile', profileData);
    setUser((prev) => ({ ...prev, ...updated }));
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

