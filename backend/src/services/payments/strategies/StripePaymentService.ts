import { PaymentService, SuccessCallback, FailureCallback } from '../PaymentInterface';
import { Stripe } from 'stripe';

export class StripePaymentService implements PaymentService {
  private stripe: Stripe;

  constructor(private apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCustomer(
    data: object,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const customer = await this.stripe.customers.create(data);
      if (onSuccess) onSuccess(customer.id);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async createCheckoutSession(
    priceId: string,
    stripeCustomerId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: { userId: string; planType: string },
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
          metadata,
        },
      } as Stripe.Checkout.SessionCreateParams);
      
      if (onSuccess) onSuccess(session.url || '');
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  handleWebhookReceived(
    event: object,
    signature: string,
    secret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      JSON.stringify(event),
      signature,
      secret
    );
  }

  async updateSubscription(
    subscriptionId: string,
    data: Stripe.SubscriptionUpdateParams,
    onSuccess?: SuccessCallback<Stripe.Subscription>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        data
      );
      if (onSuccess) onSuccess(subscription);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    onSuccess?: SuccessCallback<Stripe.Subscription>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      if (onSuccess) onSuccess(subscription);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  // Add method to retrieve a subscription
  async retrieveSubscription(
    subscriptionId: string,
    onSuccess?: SuccessCallback<Stripe.Subscription>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      if (onSuccess) onSuccess(subscription);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  // Add method to retrieve a checkout session
  async retrieveCheckoutSession(
    sessionId: string,
    onSuccess?: SuccessCallback<Stripe.Checkout.Session>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (onSuccess) onSuccess(session);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    stripeCustomerId: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: stripeCustomerId,
      });
      if (onSuccess) onSuccess(paymentIntent.client_secret || '');
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async createSubscription(
    customerId: string,
    planId: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
      });
      if (onSuccess) onSuccess(subscription.id);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async listPaymentsForCustomer(
    customerId: string,
    onSuccess?: SuccessCallback<Stripe.PaymentIntent[]>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const paymentIntents = await this.stripe.paymentIntents.list({
        customer: customerId,
      });
      if (onSuccess) onSuccess(paymentIntents.data);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async createSetupIntent(
    customerId: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
      });
      if (onSuccess) onSuccess(setupIntent.client_secret || '');
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }

  async getCustomerSubscriptions(
    customerId: string,
    onSuccess?: SuccessCallback<Stripe.Subscription[]>,
    onFailure?: FailureCallback
  ): Promise<void> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
      });
      if (onSuccess) onSuccess(subscriptions.data);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  }
}