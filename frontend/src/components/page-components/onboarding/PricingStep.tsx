import React from 'react';
import { Check } from 'lucide-react';
import { UserProfile, PRICING_PLANS } from 'shared';

interface PlanStepProps {
  data: UserProfile;
  onChange: (value: Partial<UserProfile>) => void;
}

const PlanStep: React.FC<PlanStepProps> = ({ data, onChange }) => {
  return (
    <div className='dark:text-white'>
      <h2 className="text-2xl font-semibold mb-4">Choose Your Plan</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Select the plan that best fits your needs. You can always change this later.
      </p>

      <div className="space-y-4">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.type}
            onClick={() => onChange({ selectedPlan: plan.type })}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all
              ${data.selectedPlan === plan.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              </div>
              <span className="text-xl font-bold">{plan.price}</span>
            </div>

            <ul className="space-y-2 mt-4">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanStep;