import { Router } from 'express';
import publicRoutes from './public.routes.js';
import bookingsRoutes from './bookings.routes.js';
import assistantRoutes from './assistant.routes.js';
import ownerRoutes from './owner.routes.js';
import profileRoutes from './profile.routes.js';

const router = Router();

// Mount public routes
router.use('/', publicRoutes);

// Mount customer bookings & reviews
router.use('/bookings', bookingsRoutes);

// Mount AI Assistant routes
router.use('/assistant', assistantRoutes);

// Mount shopkeeper owner routes
router.use('/owner', ownerRoutes);

// Mount user profile routes
router.use('/profile', profileRoutes);

export default router;

