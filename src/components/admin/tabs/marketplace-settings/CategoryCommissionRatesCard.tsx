
import React, { useState } from "react";
import { useCategoryCommissionRates } from "@/hooks/useCategoryCommissionRates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { CategoryCommissionRateDialog } from "./CategoryCommissionRateDialog";
import { CategoryCommissionRate } from "@/types/category-commission-rate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export const CategoryCommissionRatesCard: React.FC = () => {
  const { data, isLoading, deleteCategoryRate, isDeleting } = useCategoryCommissionRates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CategoryCommissionRate | null>(null);

  const handleAddNew = () => {
    setEditingRate(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (rate: CategoryCommissionRate) => {
    setEditingRate(rate);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this rate?")) {
      deleteCategoryRate(id);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Category Commission Rates</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Category</TableHead>
                <TableHead className="text-left">Country</TableHead>
                <TableHead className="text-right">Rate (%)</TableHead>
                <TableHead className="text-right">Currency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.category_id}</TableCell>
                  <TableCell>{row.country_code}</TableCell>
                  <TableCell className="text-right">{row.commission_rate}</TableCell>
                  <TableCell className="text-right">{row.currency}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(row.id!)}
                      disabled={isDeleting}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CategoryCommissionRateDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingRate}
      />
    </Card>
  );
};
export default CategoryCommissionRatesCard;
