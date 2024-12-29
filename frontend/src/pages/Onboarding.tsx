import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileStatus, useProfile } from '../contexts/ProfileProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shadcn/button';
import { AuthStatus, useAuth } from '../contexts/AuthenticationProvider';
import { ChevronRight, ChevronLeft, User, Building2, CreditCard, Check, Sparkles } from 'lucide-react';
import { STEPS } from '../components/page-components/onboarding/types';
import WelcomeStep from '../components/page-components/onboarding/WelcomeStep';
import PersonalStep from '../components/page-components/onboarding/PersonalStep';
import CompanyStep from '../components/page-components/onboarding/CompanyStep';
import PlanStep from '../components/page-components/onboarding/PricingStep';
import { UserProfile } from 'shared';
import { useApi } from '../contexts/ApiContext';

const OnboardingFlow: React.FC = () => {
  const { completeOnboarding, status: profileStatus } = useProfile();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { fetchWithAuth } = useApi();

  useEffect(() => {
    if (!authState) return;

    switch (authState.status) {
      case AuthStatus.UNAUTHENTICATED:
        // Redirect to login with return URL
        navigate(`/authentication?mode=login&returnUrl=${encodeURIComponent('/onboarding')}`);
        break;
        
      case AuthStatus.AUTHENTICATED:
        // Check if user should be here
        if (profileStatus === ProfileStatus.COMPLETE) {
          navigate('/dashboard');
          return;
        }
        
        if (profileStatus !== ProfileStatus.NO_PROFILE && 
            profileStatus !== ProfileStatus.NEEDS_ONBOARDING) {
          return;
        }
        
        break;
        
      case AuthStatus.LOADING:

        break;
    }
  }, [authState, profileStatus, navigate]);
  
  const [data, setData] = useState<UserProfile>({
    displayName: authState.user?.name || '',
  });

  const steps = [
    {
      id: STEPS.WELCOME,
      title: 'Welcome',
      icon: <Sparkles className="w-6 h-6" />,
      component: <WelcomeStep displayName={data.displayName} />,
      validationFn: () => null // No validation for welcome step
    },
    {
      id: STEPS.PERSONAL,
      title: 'Profile',
      icon: <User className="w-6 h-6" />,
      component: (
        <PersonalStep 
          data={data} 
          onChange={handleDataChange}
          errors={errors}
        />
      ),
      validationFn: validatePersonalStep
    },
    {
      id: STEPS.COMPANY,
      title: 'Company',
      icon: <Building2 className="w-6 h-6" />,
      component: (
        <CompanyStep 
          data={data} 
          onChange={handleDataChange}
          errors={errors}
        />
      ),
      validationFn: validateCompanyStep
    },
    {
      id: STEPS.PLAN,
      title: 'Plan',
      icon: <CreditCard className="w-6 h-6" />,
      component: (
        <PlanStep 
          data={data} 
          onChange={handleDataChange}
        />
      ),
      validationFn: validatePlanStep
    }
  ];

  function handleDataChange(newData: Partial<UserProfile>) {
    setData(prev => ({ ...prev, ...newData }));
    // Clear errors for changed fields
    const updatedErrors = { ...errors };
    Object.keys(newData).forEach(key => {
      delete updatedErrors[key];
    });
    setErrors(updatedErrors);
  }

  function validatePersonalStep(): Record<string, string> | null {
    const stepErrors: Record<string, string> = {};
    
    if (!data.displayName?.trim()) {
      stepErrors.displayName = 'Display name is required';
    }
  
    if (data.phoneNumber) {
      // Simpler validation: just ensure it starts with + and has enough digits
      const digitsOnly = data.phoneNumber.replace(/[^\d]/g, '');
      if (!data.phoneNumber.startsWith('+') || digitsOnly.length < 10) {
        stepErrors.phoneNumber = 'Please enter a valid international phone number starting with +';
      }
    }
  
    return Object.keys(stepErrors).length > 0 ? stepErrors : null;
  }

  function validateCompanyStep(): Record<string, string> | null {
    const stepErrors: Record<string, string> = {};
    
    if (!data.industry) {
      stepErrors.industry = 'Please select your industry';
    }
    
    if (!data.referralSource) {
      stepErrors.referralSource = 'Please tell us how you heard about us';
    }

    return Object.keys(stepErrors).length > 0 ? stepErrors : null;
  }

  function validatePlanStep(): Record<string, string> | null {
    const stepErrors: Record<string, string> = {};
    
    if (!data.selectedPlan) {
      stepErrors.plan = 'Please select a plan';
    }

    return Object.keys(stepErrors).length > 0 ? stepErrors : null;
  }

  async function handleNext() {
    const currentStepValidation = steps[step].validationFn;
    const stepErrors = currentStepValidation();
  
    if (stepErrors) {
      setErrors(stepErrors);
      return;
    }
  
    if (step === steps.length - 1) {
      try {
        // 1. First create the Stripe customer
        const createCustomerResponse = await fetchWithAuth('api/payments/create-customer', {
          method: 'POST',
          body: JSON.stringify({
            name: data.displayName,
            email: authState.user?.email,
            phone: data.phoneNumber,
            metadata: {
              industry: data.industry,
              companyName: data.companyName,
              companySize: data.companySize,
            }
          }),
        });
  
        if (!createCustomerResponse.ok) {
          throw new Error('Failed to create customer');
        }
  
        const { customerId } = await createCustomerResponse.json();
  
        // 2. If they selected a paid plan, create a checkout session
        if (data.selectedPlan && data.selectedPlan !== 'free') {
          const checkoutResponse = await fetchWithAuth('api/payments/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({
              priceId: data.selectedPlan, // Your Stripe price ID
              customerId,
              successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
              cancelUrl: `${window.location.origin}/onboarding`,
            }),
          });
  
          if (!checkoutResponse.ok) {
            throw new Error('Failed to create checkout session');
          }
  
          const { url: checkoutUrl } = await checkoutResponse.json();
  
          // 3. Complete onboarding with the customer ID
          const profileData = {
            displayName: data.displayName,
            ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
            ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
            industry: data.industry,
            referralSource: data.referralSource,
            ...(data.companyName && { companyName: data.companyName }),
            ...(data.companySize && { companySize: data.companySize }),
            selectedPlan: data.selectedPlan,
            stripeCustomerId: customerId, // Store the Stripe customer ID
          };
          
          await completeOnboarding(profileData);
  
          // 4. Redirect to Stripe Checkout
          window.location.href = checkoutUrl;
        } else {
          // If free plan, just complete onboarding
          const profileData = {
            displayName: data.displayName,
            ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
            ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
            industry: data.industry,
            referralSource: data.referralSource,
            ...(data.companyName && { companyName: data.companyName }),
            ...(data.companySize && { companySize: data.companySize }),
            selectedPlan: data.selectedPlan,
            stripeCustomerId: customerId, // Store the Stripe customer ID
          };
          
          await completeOnboarding(profileData);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setErrors({ submit: 'Failed to complete onboarding. Please try again.' });
      }
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 fixed top-0">
        <motion.div
          className="bg-blue-600 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Center container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-4 pt-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-center w-8 h-8 rounded-full 
                  ${i === step 
                    ? 'bg-blue-600 text-white' 
                    : i < step 
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : s.icon}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                {steps[step].component}
              </motion.div>
            </AnimatePresence>

            {/* Global error message */}
            {errors.submit && (
              <div className="text-red-500 text-sm mt-4">
                {errors.submit}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : <div />}
              
              <Button
                onClick={handleNext}
                className="flex items-center"
              >
                {step === steps.length - 1 ? 'Complete' : 'Continue'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
