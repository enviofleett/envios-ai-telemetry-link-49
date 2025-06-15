
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SMSLogsPaginationProps {
  page: number;
  limit: number;
  total: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

const SMSLogsPagination: React.FC<SMSLogsPaginationProps> = ({ page, limit, total, setPage, setLimit }) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLimit(limit > 5 ? limit - 5 : 5)}
          disabled={limit <= 5}
        >
          Decrease Limit
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLimit(limit + 5)}>
          Increase Limit
        </Button>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationPrevious
            href="#"
            aria-disabled={page === 1}
            onClick={(e) => {
              if (page === 1) {
                e.preventDefault();
                return;
              }
              setPage(Math.max(page - 1, 1));
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
          <PaginationNext
            href="#"
            aria-disabled={page === Math.ceil(total / limit)}
            onClick={(e) => {
              if (page === Math.ceil(total / limit)) {
                e.preventDefault();
                return;
              }
              setPage(page + 1);
            }}
            className={page === Math.ceil(total / limit) ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default SMSLogsPagination;

