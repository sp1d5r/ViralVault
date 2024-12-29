import React from 'react';
import { Building2, Users2 } from 'lucide-react';
import { Input } from '../../shadcn/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../shadcn/select';
import {UserProfile} from 'shared';
import { FormField } from '../../ui/FormField';
import { 
  INDUSTRY_OPTIONS, 
  COMPANY_SIZE_OPTIONS, 
  REFERRAL_OPTIONS 
} from './constants';

interface CompanyStepProps {
  data: UserProfile;
  onChange: (value: Partial<UserProfile>) => void;
  errors: Record<string, string>;
}

const CompanyStep: React.FC<CompanyStepProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6 dark:text-white">
      <h2 className="text-2xl font-semibold mb-4">Company Details</h2>

      <FormField
        label="Company Name"
        error={errors.companyName}
      >
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="Your company name"
            className="pl-10"
          />
        </div>
      </FormField>

      <FormField
        label="Industry*"
        error={errors.industry}
        required
      >
        <Select
          value={data.industry}
          onValueChange={(value) => onChange({ industry: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label="Company Size"
        error={errors.companySize}
      >
        <div className="relative">
          <Users2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Select
            value={data.companySize}
            onValueChange={(value) => onChange({ companySize: value })}
          >
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Number of employees" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormField>

      <FormField
        label="How did you hear about us?*"
        error={errors.referralSource}
        required
      >
        <Select
          value={data.referralSource}
          onValueChange={(value) => onChange({ referralSource: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select referral source" />
          </SelectTrigger>
          <SelectContent>
            {REFERRAL_OPTIONS.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
};

export default CompanyStep;