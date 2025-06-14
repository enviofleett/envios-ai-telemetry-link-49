
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoryCommissionRates } from "@/hooks/useCategoryCommissionRates";
import { CategoryCommissionRate } from "@/types/category-commission-rate";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: CategoryCommissionRate | null;
}

const formSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  country_code: z.string().min(2, "Country code is required").max(2, "Country code must be 2 characters"),
  commission_rate: z.coerce.number().min(0, "Rate must be non-negative"),
  currency: z.string().min(3, "Currency is required").max(3, "Currency must be 3 characters"),
});

export const CategoryCommissionRateDialog: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { saveCategoryRate, isSaving } = useCategoryCommissionRates();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      category_id: "",
      country_code: "US",
      commission_rate: 10,
      currency: "USD",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData || {
        category_id: "",
        country_code: "US",
        commission_rate: 10,
        currency: "USD",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const upsertPayload = {
        ...initialData,
        ...values,
    };
    saveCategoryRate(upsertPayload, {
      onSuccess: () => {
        onClose();
      },
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Category Commission Rate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            {/* In a real app, this would be a Select dropdown populated from a categories table */}
            <Input id="category_id" {...register("category_id")} />
            {errors.category_id && <p className="text-destructive text-sm">{errors.category_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country_code">Country Code (2-letter)</Label>
            <Input id="country_code" {...register("country_code")} />
            {errors.country_code && <p className="text-destructive text-sm">{errors.country_code.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
            <Input id="commission_rate" type="number" step="0.01" {...register("commission_rate")} />
            {errors.commission_rate && <p className="text-destructive text-sm">{errors.commission_rate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency (3-letter)</Label>
            <Input id="currency" {...register("currency")} />
            {errors.currency && <p className="text-destructive text-sm">{errors.currency.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
