
import React from 'react';
import { Workshop } from '@/types/workshop';
import WorkshopCard from './WorkshopCard';

interface WorkshopGridProps {
  workshops: Workshop[] | undefined;
  isLoading: boolean;
  isConnecting: boolean;
  onConnect: (workshopId: string) => void;
}

const WorkshopGrid: React.FC<WorkshopGridProps> = ({
  workshops,
  isLoading,
  isConnecting,
  onConnect
}) => {
  if (workshops?.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          No workshops found. Try adjusting your search criteria.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workshops?.map((workshop) => (
        <WorkshopCard
          key={workshop.id}
          workshop={workshop}
          onConnect={onConnect}
          isConnecting={isConnecting}
        />
      ))}
    </div>
  );
};

export default WorkshopGrid;
