
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RotateCcw
} from 'lucide-react';
import { useBillingManagement } from '@/hooks/useBillingManagement';
import { DeviceSubscription } from '@/types/billing';
import { format, addYears } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const SubscriptionManagement = () => {
  const {
    subscriptions,
    servicePlans,
    subscriptionsLoading,
    cancelSubscription,
    renewSubscription,
    updateSubscription,
    cancelSubscriptionMutation,
    renewSubscriptionMutation,
    updateSubscriptionMutation
  } = useBillingManagement();

  const [selectedSubscription, setSelectedSubscription] = useState<DeviceSubscription | null>(null);
  const [showRenewDialog, setShowRenewDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleRenewSubscription = async (subscription: DeviceSubscription) => {
    const currentEndDate = new Date(subscription.end_date);
    const newEndDate = addYears(currentEndDate, 1);
    
    try {
      await renewSubscription(subscription.id, newEndDate.toISOString());
      setShowRenewDialog(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Failed to renew subscription:', error);
    }
  };

  const handleSuspendSubscription = async (subscription: DeviceSubscription) => {
    try {
      await updateSubscription(subscription.id, { 
        subscription_status: 'suspended' 
      });
    } catch (error) {
      console.error('Failed to suspend subscription:', error);
    }
  };

  const handleReactivateSubscription = async (subscription: DeviceSubscription) => {
    try {
      await updateSubscription(subscription.id, { 
        subscription_status: 'active' 
      });
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    }
  };

  const handleCancelSubscription = async (subscription: DeviceSubscription) => {
    if (window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      try {
        await cancelSubscription(subscription.id);
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  if (subscriptionsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        <Button>Add New Subscription</Button>
      </div>

      <div className="grid gap-4">
        {subscriptions?.map((subscription) => {
          const daysUntilExpiry = getDaysUntilExpiry(subscription.end_date);
          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          const isExpired = daysUntilExpiry <= 0;

          return (
            <Card key={subscription.id} className={`${isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''} ${isExpired ? 'border-red-200 bg-red-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Device: {subscription.device_id}
                      <Badge className={getStatusColor(subscription.subscription_status)}>
                        {getStatusIcon(subscription.subscription_status)}
                        <span className="ml-1">{subscription.subscription_status}</span>
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {subscription.service_plan?.plan_name || 'Unknown Plan'}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {subscription.subscription_status === 'active' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowRenewDialog(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Renew
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuspendSubscription(subscription)}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {subscription.subscription_status === 'suspended' && (
                        <DropdownMenuItem onClick={() => handleReactivateSubscription(subscription)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                      
                      {subscription.subscription_status !== 'cancelled' && (
                        <DropdownMenuItem 
                          onClick={() => handleCancelSubscription(subscription)}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Billing Cycle</p>
                    <p className="text-sm font-medium">{subscription.billing_cycle}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(subscription.start_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                      </p>
                      {isExpiringSoon && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          <Calendar className="h-3 w-3 mr-1" />
                          {daysUntilExpiry} days
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Auto Renewal</p>
                    <p className="text-sm font-medium">
                      {subscription.auto_renewal ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                {subscription.price_override && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Custom pricing: ${subscription.price_override.toFixed(2)}
                    </span>
                  </div>
                )}

                {subscription.discount_percentage > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <span className="text-sm text-green-800">
                      {subscription.discount_percentage}% discount applied
                    </span>
                  </div>
                )}

                {subscription.notes && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm">{subscription.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!subscriptions?.length && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No subscriptions found</p>
              <Button>Create First Subscription</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Renew Subscription Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSubscription && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Device: {selectedSubscription.device_id}</p>
                  <p className="text-sm text-gray-600">
                    Current expiry: {format(new Date(selectedSubscription.end_date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    New expiry: {format(addYears(new Date(selectedSubscription.end_date), 1), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowRenewDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleRenewSubscription(selectedSubscription)}
                    disabled={renewSubscriptionMutation.isPending}
                  >
                    {renewSubscriptionMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
