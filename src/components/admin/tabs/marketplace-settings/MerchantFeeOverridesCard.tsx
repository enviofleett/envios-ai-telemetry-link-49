
import React, { useState } from "react";
import { useMerchantFeeOverrides } from "@/hooks/useMerchantFeeOverrides";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { MerchantFeeOverrideDialog } from "./MerchantFeeOverrideDialog";
import { MerchantFeeOverride } from "@/types/merchant-fee-override";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const MerchantFeeOverridesCard: React.FC = () => {
  const { data, isLoading, deleteMerchantFee, isDeleting } = useMerchantFeeOverrides();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<MerchantFeeOverride | null>(null);

  const handleAddNew = () => {
    setEditingOverride(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (override: MerchantFeeOverride) => {
    setEditingOverride(override);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this override?")) {
      deleteMerchantFee(id);
    }
  };
  
  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Merchant Fee Overrides</CardTitle>
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
                <TableHead className="text-left">Merchant</TableHead>
                <TableHead className="text-left">Country</TableHead>
                <TableHead className="text-right">Custom Commission</TableHead>
                <TableHead className="text-right">Custom Reg. Fee</TableHead>
                <TableHead className="text-left">Billing Cycle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.merchant_id}</TableCell>
                  <TableCell>{row.country_code || "-"}</TableCell>
                  <TableCell className="text-right">{row.commission_rate_override ?? "-"}</TableCell>
                  <TableCell className="text-right">{row.registration_fee_override ?? "-"}</TableCell>
                  <TableCell>{row.billing_cycle || "-"}</TableCell>
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
      <MerchantFeeOverrideDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingOverride}
      />
    </Card>
  );
};
export default MerchantFeeOverridesCard;
