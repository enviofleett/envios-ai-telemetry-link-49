
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfo } from '@/types/user-management';

interface UserTablePaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

const UserTablePagination: React.FC<UserTablePaginationProps> = ({
  pagination,
  currentPage,
  onPageChange,
  pageSize
}) => {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} users
        </span>
        <span>Page {currentPage} of {pagination.totalPages}</span>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
              if (pageNum > pagination.totalPages) return null;
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={pageNum === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(Math.min(pagination.totalPages, currentPage + 1))}
                className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default UserTablePagination;
