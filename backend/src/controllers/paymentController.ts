import { Request, Response } from 'express';
import { PaymentService } from '../services/payments/PaymentsService';
import {FirebaseDatabaseService} from 'shared';
import Stripe from 'stripe';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    const event = PaymentService.handleWebhookReceived(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    ) as Stripe.Event;
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get customer ID and metadata from the session
        const { customer, metadata } = session;
        const userId = metadata?.userId; // Make sure to pass this in createCheckoutSession

        if (userId) {
          // Update user profile in Firebase
          await updateUserSubscription(userId, {
            stripeCustomerId: customer as string,
            selectedPlan: metadata.planType, // Add this to session metadata
            subscriptionStatus: 'active',
            subscriptionId: session.subscription as string,
            currentPeriodEnd: new Date(
              (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000
            ).toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId; // Make sure to pass this when creating subscription

        if (userId) {
          await updateUserSubscription(userId, {
            subscriptionStatus: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        }
        break;
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
      const { email, name, metadata } = req.body;
      
      await PaymentService.createCustomer(
        {
          email,
          name,
          metadata: {
            ...metadata,
            userId: req.user?.uid,
          },
        },
        (customerId) => {
          res.json({ customerId });
        },
        (error) => {
          res.status(400).json({ error: error.message });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };


// Helper function to update user subscription in Firebase
async function updateUserSubscription(userId: string, data: Partial<unknown>) {
  return new Promise<void>((resolve, reject) => {
    FirebaseDatabaseService.updateDocument(
      'users',
      userId,
      data,
      () => resolve(),
      (error) => reject(error)
    );
  });
}

// Update createCheckoutSession to include metadata
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl, userId, planType } = req.body;
    
    await PaymentService.createCheckoutSession(
      priceId,
      customerId,
      successUrl,
      cancelUrl,
      {
        userId,
        planType,
      }, // Add metadata
      (sessionUrl) => {
        res.json({ url: sessionUrl });
      },
      (error) => {
        res.status(400).json({ error: error.message });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCustomerSubscriptions = async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      
      await PaymentService.getCustomerSubscriptions(
        customerId,
        (subscriptions) => {
          res.json({ subscriptions });
        },
        (error) => {
          res.status(400).json({ error: error.message });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      
      await PaymentService.cancelSubscription(
        subscriptionId,
        (subscription) => {
          res.json({ subscription });
        },
        (error) => {
          res.status(400).json({ error: error.message });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const updateSubscription = async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const updateData = req.body;
      
      await PaymentService.updateSubscription(
        subscriptionId,
        updateData,
        (subscription) => {
          res.json({ subscription });
        },
        (error) => {
          res.status(400).json({ error: error.message });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const retrieveSubscription = async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      
      await PaymentService.retrieveSubscription(
        subscriptionId,
        (subscription) => {
          res.json({ subscription });
        },
        (error) => {
          res.status(400).json({ error: error.message });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const retrieveCheckoutSession = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      await PaymentService.retrieveCheckoutSession(
        sessionId,
        (session) => {
          res.json({ session });
        },
        (error) => {
          res.status(400).json({ error: error.message });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };