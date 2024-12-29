import React from 'react';
import { Input } from '../../shadcn/input';
import { Calendar, Phone, User } from 'lucide-react';
import { UserProfile } from 'shared';
import { FormField } from '../../ui/FormField';

interface PersonalStepProps {
  data: UserProfile;
  onChange: (value: Partial<UserProfile>) => void;
  errors: Record<string, string>;
}

const PersonalStep: React.FC<PersonalStepProps> = ({ data, onChange, errors }) => {
  const handlePhoneChange = (value: string) => {
    // Allow only digits, plus sign at start, and spaces
    const cleaned = value.replace(/[^\d\s+]/g, '');
    
    // Ensure only one + at the start
    const formatted = cleaned.replace(/\+{2,}/g, '+').replace(/(?!^)\+/g, '');
    
    // Limit length to prevent unreasonably long numbers (max 15 digits + spaces + plus)
    if (formatted.replace(/[^\d]/g, '').length <= 15) {
      onChange({ phoneNumber: formatted });
    }
  };

  return (
    <div className="space-y-6 dark:text-white">
      <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
      
      <FormField
        label="Display Name*"
        error={errors.displayName}
        required
      >
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={data.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            placeholder="How should we call you?"
            className="pl-10"
          />
        </div>
      </FormField>

      <FormField
        label="Phone Number"
        error={errors.phoneNumber}
      >
        <div className="space-y-2">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={data.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+1 234 567 8900"
              className="pl-10"
            />
          </div>
          <p className="text-sm text-gray-500">
            Include country code (e.g., +1 for US, +44 for UK)
          </p>
        </div>
      </FormField>

      <FormField
        label="Date of Birth"
        error={errors.dateOfBirth}
      >
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className="pl-10"
          />
        </div>
      </FormField>
    </div>
  );
};

export default PersonalStep;