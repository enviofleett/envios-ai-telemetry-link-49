
import React, { useState } from "react";
import { useCountryMarketplaceSettings } from "@/hooks/useCountryMarketplaceSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { CountryMarketplaceSettingsDialog } from "./CountryMarketplaceSettingsDialog";
import { CountryMarketplaceSettings } from "@/types/country-marketplace-settings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export const CountryMarketplaceSettingsCard: React.FC = () => {
  const { data, isLoading, deleteCountrySettings, isDeleting } = useCountryMarketplaceSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<CountryMarketplaceSettings | null>(null);

  const handleAddNew = () => {
    setEditingSettings(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (settings: CountryMarketplaceSettings) => {
    setEditingSettings(settings);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this country setting?")) {
      deleteCountrySettings(id);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Country Marketplace Settings</CardTitle>
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
                <TableHead className="text-left">Country</TableHead>
                <TableHead className="text-right">Currency</TableHead>
                <TableHead className="text-right">Commission Rate</TableHead>
                <TableHead className="text-right">Registration Fee</TableHead>
                <TableHead className="text-left">Billing Cycles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.country_code}</TableCell>
                  <TableCell className="text-right">{row.currency}</TableCell>
                  <TableCell className="text-right">{row.default_commission_rate}</TableCell>
                  <TableCell className="text-right">{row.default_registration_fee}</TableCell>
                  <TableCell>{row.billing_cycles?.join(", ")}</TableCell>
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
      <CountryMarketplaceSettingsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingSettings}
      />
    </Card>
  );
};
export default CountryMarketplaceSettingsCard;
