export const STEPS = {
    WELCOME: 'welcome', 
    PERSONAL: 'personal',
    COMPANY: 'company',
    PLAN: 'plan',
  } as const;
  
export type StepId = typeof STEPS[keyof typeof STEPS];
