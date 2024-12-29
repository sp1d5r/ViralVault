import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../shadcn/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../shadcn/card';
import { Input } from '../../shadcn/input';
import { Label } from '../../shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shadcn/select';
import { useToast } from '../../../contexts/ToastProvider';
import {
  User,
  Building2,
  CreditCard,
  Phone,
  Calendar,
  Briefcase,
  Edit2,
  X,
  Check,
  Crown,
  Zap,
  CircleDashed
} from 'lucide-react';
import {UserProfile,  Plan, PRICING_PLANS} from 'shared';
import { useProfile } from '../../../contexts/ProfileProvider';
import { useApi } from '../../../contexts/ApiContext';

const DashboardProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {profile} = useProfile();
  const {fetchWithAuth} = useApi();

  const [editedData, setEditedData] = useState<UserProfile>(profile!);

  const handleUpgrade = async (plan: Plan) => {
    if (plan.type === 'free') {
      // Handle downgrade to free plan
      // You might want to show a confirmation modal
      return;
    }

    if (plan.type === 'enterprise') {
      // Redirect to contact sales page or show contact form
      window.location.href = '/contact-sales';
      return;
    }

    try {
      setIsLoading(true);

      // Create checkout session
      const response = await fetchWithAuth('api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          customerId: profile?.stripeCustomerId,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      });

      console.log("Response:", response);
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPlan = () => {
    return PRICING_PLANS.find(plan => plan.type === profile!.selectedPlan) || PRICING_PLANS[0];
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const ProfileSection: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
  }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center space-x-4 p-2">
      <Icon className="w-5 h-5 text-gray-500" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );

  const ProfileCard = () => (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <motion.div layout className="space-y-4">
          {isEditing ? (
            <EditForm />
          ) : (
            <ViewMode />
          )}
        </motion.div>
      </CardContent>
    </Card>
  );

  const ViewMode = () => (
    <>
      <ProfileSection icon={User} label="Display Name" value={profile!.displayName} />
      <ProfileSection icon={Phone} label="Phone" value={profile!.phoneNumber || ''} />
      <ProfileSection icon={Calendar} label="Date of Birth" value={profile!.dateOfBirth || ''} />
      <ProfileSection icon={Building2} label="Company" value={profile!.companyName || ''} />
      <ProfileSection icon={Briefcase} label="Company Size" value={profile!.companySize || ''} />
      <ProfileSection icon={Crown} label="Current Plan" value={getCurrentPlan().name} />
    </>
  );

  const EditForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={editedData.displayName}
            onChange={(e) => setEditedData({...editedData, displayName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={editedData.phoneNumber}
            onChange={(e) => setEditedData({...editedData, phoneNumber: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={editedData.companyName}
            onChange={(e) => setEditedData({...editedData, companyName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySize">Company Size</Label>
          <Select 
            value={editedData.companySize}
            onValueChange={(value) => setEditedData({...editedData, companySize: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="50-100">50-100</SelectItem>
              <SelectItem value="100+">100+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={handleCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );

  const SubscriptionCard = () => {
    const currentPlan = getCurrentPlan();
    
    return (
      <Card className="w-full max-w-2xl mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Subscription</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Plan: {currentPlan.name}</h3>
              <p className="text-sm text-gray-500">{currentPlan.price}</p>
              {profile?.subscriptionStatus && (
                <p className="text-sm text-gray-500">
                  Status: {profile.subscriptionStatus}
                </p>
              )}
              {profile?.currentPeriodEnd && (
                <p className="text-sm text-gray-500">
                  Renews: {new Date(profile.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircleDashed className="w-4 h-4 mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Change Plan
            </Button>
          </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Plan Features:</h4>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const UpgradeModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Change Subscription Plan</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowUpgradeModal(false)}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <Card 
                key={plan.type} 
                className={`p-6 ${profile!.selectedPlan === plan.type ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl flex items-center">
                      {plan.name}
                      {plan.type === 'pro' && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Popular
                        </span>
                      )}
                    </h3>
                    <p className="text-2xl font-bold">{plan.price}</p>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full mt-4"
                    variant={profile!.selectedPlan === plan.type ? "outline" : "default"}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {isLoading ? (
                      <CircleDashed className="w-4 h-4 mr-2" />
                    ) : profile!.selectedPlan === plan.type ? (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {plan.type === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (!profile) {
    return <div className="min-h-screen bg-gray-50 p-6">
        <h1>Failed to get user info</h1>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">User Profile</h1>
          <ProfileCard />
          <SubscriptionCard />
        </motion.div>

        <AnimatePresence>
          {showUpgradeModal && <UpgradeModal />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardProfile;