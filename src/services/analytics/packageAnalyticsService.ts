
import { supabase } from '@/integrations/supabase/client';

export const packageAnalyticsService = {
  async getPackageSubscriptionDistribution() {
    // Fetch all active subscriptions with package_id
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('package_id')
      .eq('subscription_status', 'active');
    if (error) throw error;

    // Count subscriptions per package_id
    const counts: Record<string, number> = {};
    (subscriptions || []).forEach((row: any) => {
      counts[row.package_id] = (counts[row.package_id] || 0) + 1;
    });

    // Fetch package names for the associated IDs
    const packageIds = Object.keys(counts);
    let packageNames: Record<string, string> = {};
    if (packageIds.length) {
      const { data: pkgs } = await supabase
        .from('subscriber_packages')
        .select('id, package_name')
        .in('id', packageIds);
      packageNames = Object.fromEntries((pkgs || []).map((p: any) => [p.id, p.package_name]));
    }

    // Shape data for chart
    return packageIds.map((pkgId) => ({
      id: pkgId,
      name: packageNames[pkgId] || pkgId,
      count: counts[pkgId]
    }));
  },

  async getRevenueByPackage() {
    // For each package, sum estimated monthly revenue from subscriptions
    const { data: pkgs, error } = await supabase
      .from('subscriber_packages')
      .select('id, package_name, subscription_fee_monthly, subscription_fee_annually');
    if (error) throw error;

    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('package_id, billing_cycle');

    const revenueMap: Record<string, number> = {};
    (subscriptions || []).forEach((sub: any) => {
      const pkg = pkgs?.find((p: any) => p.id === sub.package_id);
      if (!pkg) return;
      let fee =
        sub.billing_cycle === 'monthly'
          ? (pkg.subscription_fee_monthly || 0)
          : ((pkg.subscription_fee_annually || 0) / 12);
      revenueMap[sub.package_id] = (revenueMap[sub.package_id] || 0) + fee;
    });

    return (pkgs || []).map((pkg: any) => ({
      id: pkg.id,
      name: pkg.package_name,
      revenue: Math.round(revenueMap[pkg.id] || 0),
    }));
  },

  async getFeatureUsageMatrix() {
    // Number of users per feature (joined through assignments)
    const { data: features } = await supabase
      .from('package_features')
      .select('id, feature_name, category');

    const { data: assignments } = await supabase
      .from('package_feature_assignments')
      .select('feature_id, package_id');

    const { data: userSubs } = await supabase
      .from('user_subscriptions')
      .select('package_id');

    // Calculate usage
    const featureMap: Record<string, { feature_name: string; count: number }> = {};
    (features || []).forEach((f: any) => {
      const featurePackageIds = (assignments || []).filter((a: any) => a.feature_id === f.id).map((a: any) => a.package_id);
      const count = (userSubs || []).filter((s: any) => featurePackageIds.includes(s.package_id)).length;
      featureMap[f.id] = { feature_name: f.feature_name, count };
    });

    return Object.values(featureMap);
  },

  async getReferralCodePerformance() {
    const { data: codes } = await supabase.from('referral_codes').select('id, code, usage_count, discount_percentage');
    return codes || [];
  },
};
