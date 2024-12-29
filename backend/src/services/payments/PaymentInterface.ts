import { Stripe } from 'stripe';

export type SuccessCallback<T> = (data: T) => void;
export type FailureCallback = (error: Error) => void;

export interface CheckoutSessionMetadata {
  userId: string;
  planType: string;
}

export interface PaymentService {
  createCustomer(
    data: object,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void>;

  createCheckoutSession(
    priceId: string,
    stripeCustomerId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: CheckoutSessionMetadata,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void>;

  createPaymentIntent(
    amount: number,
    currency: string,
    stripeCustomerId: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void>;

  handleWebhookReceived(
    event: object,
    signature: string,
    secret: string
  ): Stripe.Event;

  createSubscription(
    customerId: string,
    planId: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void>;

  listPaymentsForCustomer(
    customerId: string,
    onSuccess?: SuccessCallback<Stripe.PaymentIntent[]>,
    onFailure?: FailureCallback
  ): Promise<void>;

  createSetupIntent(
    customerId: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback
  ): Promise<void>;

  getCustomerSubscriptions(
    customerId: string,
    onSuccess?: SuccessCallback<Stripe.Subscription[]>,
    onFailure?: FailureCallback
  ): Promise<void>;

  updateSubscription(
    subscriptionId: string,
    data: Stripe.SubscriptionUpdateParams,
    onSuccess?: SuccessCallback<Stripe.Subscription>,
    onFailure?: FailureCallback
  ): Promise<void>;

  cancelSubscription(
    subscriptionId: string,
    onSuccess?: SuccessCallback<Stripe.Subscription>,
    onFailure?: FailureCallback
  ): Promise<void>;

  retrieveSubscription(
    subscriptionId: string,
    onSuccess?: SuccessCallback<Stripe.Subscription>,
    onFailure?: FailureCallback
  ): Promise<void>;

  retrieveCheckoutSession(
    sessionId: string,
    onSuccess?: SuccessCallback<Stripe.Checkout.Session>,
    onFailure?: FailureCallback
  ): Promise<void>;
}
