import express from 'express';
import { 
  createCheckoutSession,
  handleWebhook,
  createCustomer,
  getCustomerSubscriptions,
  cancelSubscription,
  updateSubscription,
  retrieveSubscription,
  retrieveCheckoutSession
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes (require authentication)
router.post('/create-checkout-session', authenticateToken, createCheckoutSession);
router.post('/create-customer', authenticateToken,  createCustomer);
router.get('/subscriptions/:customerId', authenticateToken, getCustomerSubscriptions);
router.post('/subscriptions/:subscriptionId/cancel', authenticateToken, cancelSubscription);
router.put('/subscriptions/:subscriptionId', authenticateToken, updateSubscription);
router.get('/subscriptions/:subscriptionId', authenticateToken, retrieveSubscription);
router.get('/checkout-sessions/:sessionId', authenticateToken, retrieveCheckoutSession);

export default router;