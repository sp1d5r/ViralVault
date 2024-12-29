import { StripePaymentService } from './strategies/StripePaymentService';

export const PaymentService = new StripePaymentService(process.env.STRIPE_API_KEY!);
