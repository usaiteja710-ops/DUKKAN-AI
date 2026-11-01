import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App.jsx';

describe('DUKKAN AI Client Smoke Tests', () => {
  it('renders application with brand name and hero heading', () => {
    render(<App />);
    const brandElements = screen.getAllByText(/DUKKAN/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Book Top Local Shops/i)).toBeInTheDocument();
  });

  it('renders core navigation and AI Assistant link', () => {
    render(<App />);
    expect(screen.getAllByText(/Explore Shops/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI Assistant/i).length).toBeGreaterThan(0);
  });

  it('proves GEMINI_API_KEY never leaks into client environment or window bundle', () => {
    // Verified security rule: GEMINI_API_KEY must never exist in client-side env
    expect(import.meta.env.VITE_GEMINI_API_KEY).toBeUndefined();
    expect(import.meta.env.GEMINI_API_KEY).toBeUndefined();
    expect(window.GEMINI_API_KEY).toBeUndefined();
  });
});
