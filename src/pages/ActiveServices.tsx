
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";

const ActiveServices: React.FC = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useMarketplaceOrders(user?.id);

  if (isLoading) return <div className="text-center my-10">Loading active services...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Your Active Services</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {orders.length === 0 && (
          <div className="text-muted-foreground">You have no active marketplace services.</div>
        )}
        {orders.map((order: any) => (
          <div key={order.id} className="border rounded p-4 shadow">
            <div className="font-bold">{order.marketplace_products?.title}</div>
            <div>Status: <span className="capitalize">{order.status}</span></div>
            <div>
              <span className="text-sm text-muted-foreground">
                Vehicles connected: {order.vehicle_service_connections?.length || 0}
              </span>
            </div>
            <div className="mt-2">
              <span>
                Order Amount: <b>${order.amount}</b>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ActiveServices;
