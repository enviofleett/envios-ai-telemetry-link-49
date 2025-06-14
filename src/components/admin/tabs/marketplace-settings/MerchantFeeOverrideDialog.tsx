
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMerchantFeeOverrides } from "@/hooks/useMerchantFeeOverrides";
import { useMerchants } from "@/hooks/useMerchants";
import { MerchantFeeOverride } from "@/types/merchant-fee-override";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: MerchantFeeOverride | null;
}

const formSchema = z.object({
  merchant_id: z.string().min(1, "Merchant is required"),
  country_code: z.string().optional(),
  commission_rate_override: z.coerce.number().optional(),
  registration_fee_override: z.coerce.number().optional(),
  billing_cycle: z.string().optional(),
  // Date pickers would be better for effective_from/to, skipping for now.
});

export const MerchantFeeOverrideDialog: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { saveMerchantFee, isSaving } = useMerchantFeeOverrides();
  const { data: merchants, isLoading: isLoadingMerchants } = useMerchants();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData || {
        merchant_id: "",
        country_code: "US",
        commission_rate_override: undefined,
        registration_fee_override: undefined,
        billing_cycle: "monthly",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: Partial<MerchantFeeOverride> & { merchant_id: string } = {
        ...initialData,
        ...values,
        id: initialData?.id,
        merchant_id: values.merchant_id
    };
    saveMerchantFee(payload, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Merchant Fee Override</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="merchant_id">Merchant</Label>
            <Controller
              name="merchant_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingMerchants}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.merchant_id && <p className="text-destructive text-sm">{errors.merchant_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="country_code">Country Code (optional)</Label>
            <Input id="country_code" {...register("country_code")} />
          </div>
          <div>
            <Label htmlFor="commission_rate_override">Commission Rate Override (%)</Label>
            <Input id="commission_rate_override" type="number" step="0.01" {...register("commission_rate_override")} />
          </div>
          <div>
            <Label htmlFor="registration_fee_override">Registration Fee Override</Label>
            <Input id="registration_fee_override" type="number" step="0.01" {...register("registration_fee_override")} />
          </div>
           <div>
            <Label htmlFor="billing_cycle">Billing Cycle</Label>
            <Controller
              name="billing_cycle"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
