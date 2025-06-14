
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPackage } from "@/hooks/useUserPackage";
import { usePackageLimits } from "@/hooks/usePackageLimits";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/packages/UpgradeModal";

/**
 * Usage:
 * <VehicleLimitEnforcement>
 *   <Button onClick={...}>Add Vehicle</Button>
 * </VehicleLimitEnforcement>
 * Wraps children. If user reached vehicle limit, disables children and prompts upgrade.
 */
export const VehicleLimitEnforcement: React.FC<{
  currentCount: number;
  children: React.ReactNode;
  feature?: string;
}> = ({ currentCount, children, feature = "vehicle_limit" }) => {
  const { user } = useAuth();
  const { data: pkg } = useUserPackage(user?.id);
  const { data: limits, isLoading } = usePackageLimits(pkg?.id);
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  if (isLoading) return null;
  if (!limits || !limits.vehicleLimit) return <>{children}</>;

  const limitReached = limits.vehicleLimit !== null && currentCount >= limits.vehicleLimit;

  // Clone the child and disable it if necessary (assume the child is a button)
  const cloned = React.isValidElement(children)
    ? React.cloneElement(children as any, {
        disabled: limitReached,
        onClick: limitReached
          ? () => setShowUpgrade(true)
          : (children as any).props.onClick,
      })
    : children;

  return (
    <>
      {cloned}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={feature} />
      {limitReached && (
        <div className="text-xs text-red-600 mt-1">
          Vehicle limit reached for your current plan.
        </div>
      )}
    </>
  );
};
