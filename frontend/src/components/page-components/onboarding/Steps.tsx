import React from 'react';

interface Step {
  title: string;
  description: string;
}

interface StepsProps {
  steps: Step[];
}

export const Steps: React.FC<StepsProps> = ({ steps }) => {
  return (
    <div className="space-y-4 dark:text-white">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          {/* Step number circle */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {index + 1}
            </span>
          </div>

          {/* Step content */}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};