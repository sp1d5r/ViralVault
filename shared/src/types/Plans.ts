export interface Plan {
    type: 'free' | 'pro' | 'enterprise';
    name: string;
    price: string;
    description: string;
    features: string[];
    stripePriceId?: string;
}

export const PRICING_PLANS: Plan[] = [
    {
      type: 'free',
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        'Basic Features',
        '1 User',
        'Limited Storage',
        'Community Support'
      ]
    },
    {
      type: 'pro',
      name: 'Pro',
      price: '$29/mo',
      description: 'For growing businesses',
      stripePriceId: 'price_1QM7h5GME0Qq6U11b4JKWfFy',
      features: [
        'Advanced Features',
        'Unlimited Users',
        '100GB Storage',
        'Priority Support',
        'Analytics Dashboard',
        'Custom Integrations'
      ]
    },
    {
      type: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'All Pro Features',
        'Dedicated Support',
        'Custom Storage',
        'SLA Agreement',
        'Security Features',
        'API Access'
      ]
    }
  ];
