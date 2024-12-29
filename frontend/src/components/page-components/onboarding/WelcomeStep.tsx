import React from 'react';
import { Steps } from './Steps';

const WelcomeStep: React.FC<{ displayName: string }> = ({ displayName }) => (
  <div className="space-y-6  dark:text-white">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">
        Welcome{displayName ? `, ${displayName}` : ''}! 👋
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        Let's get you set up in just a few steps.
      </p>
    </div>

    <Steps
      steps={[
        {
          title: 'Personal Details',
          description: 'Tell us about yourself'
        },
        {
          title: 'Company Information',
          description: 'Where do you work?'
        },
        {
          title: 'Choose Your Plan',
          description: 'Select the best option for you'
        }
      ]}
    />
  </div>
);

export default WelcomeStep;