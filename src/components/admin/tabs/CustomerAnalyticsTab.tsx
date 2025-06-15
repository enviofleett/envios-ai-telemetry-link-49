
import React, { useState } from 'react';
import { useCustomerAnalytics } from '@/hooks/useCustomerAnalytics';
import CustomerMetricCard from '@/components/admin/analytics/CustomerMetricCard';
import CustomerDetailsModal from '@/components/admin/analytics/CustomerDetailsModal';
import type { Column } from '@/components/admin/analytics/CustomerDetailsModal';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerAnalyticsTab: React.FC = () => {
  const { data, isLoading, isError, error } = useCustomerAnalytics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; data: any[]; columns: Column[] }>({
    title: '',
    data: [],
    columns: [],
  });

  const handleCardClick = (title: string, data: any[] | null, columns: Column[]) => {
    setModalContent({ title, data: data || [], columns });
    setIsModalOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError) {
    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="h-10 w-10 mb-4" />
          <h3 className="text-lg font-semibold">Error Loading Analytics</h3>
          <p className="text-sm text-center">There was a problem fetching customer analytics data. The database might be missing the 'orders' table or required columns.</p>
          <p className="text-xs text-center mt-2">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CustomerMetricCard
          title="Top Spenders"
          metric={data?.top_spenders?.length?.toString() ?? '0'}
          description="Customers with the highest total spending."
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          onClick={() => handleCardClick('Top Spenders', data?.top_spenders ?? [], [
            { header: 'Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Total Spent', accessor: 'total_spent', isCurrency: true },
          ])}
        />
        <CustomerMetricCard
          title="Most Orders"
          metric={data?.most_orders?.length?.toString() ?? '0'}
          description="Customers with the highest number of orders."
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
          onClick={() => handleCardClick('Most Orders', data?.most_orders ?? [], [
            { header: 'Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Order Count', accessor: 'order_count' },
          ])}
        />
        <CustomerMetricCard
          title="Repeat Customers"
          metric={data?.repeat_customers?.length?.toString() ?? '0'}
          description="Customers who have made more than one purchase."
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          onClick={() => handleCardClick('Repeat Customers', data?.repeat_customers ?? [], [
            { header: 'Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Order Count', accessor: 'order_count' },
          ])}
        />
        <CustomerMetricCard
          title="Highest Single Orders"
          metric={data?.highest_single_orders?.length?.toString() ?? '0'}
          description="Customers with the largest single transaction."
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          onClick={() => handleCardClick('Highest Single Orders', data?.highest_single_orders ?? [], [
            { header: 'Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Order Amount', accessor: 'total_amount', isCurrency: true },
          ])}
        />
      </div>
      <CustomerDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
        data={modalContent.data}
        columns={modalContent.columns}
      />
    </>
  );
};

export default CustomerAnalyticsTab;
