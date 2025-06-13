
import React from 'react';
import { Button } from '@/components/ui/button';

interface UserProfilesPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function UserProfilesPagination({
  page,
  totalPages,
  totalCount,
  onPageChange
}: UserProfilesPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = ((page - 1) * 20) + 1;
  const endItem = Math.min(page * 20, totalCount);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalCount} results
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
