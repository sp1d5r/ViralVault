export interface UserProfile {
  // User Profile Data
  displayName: string;
  phoneNumber?: string;
  dateOfBirth?: string;

  // Company/Source Data
  industry?: string;
  referralSource?: string;
  companyName?: string;
  companySize?: string;

  // Subscription Data
  selectedPlan?: 'free' | 'pro' | 'enterprise';
  
  // Stripe Data
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  subscriptionId?: string;
  currentPeriodEnd?: string; // ISO date string
}
