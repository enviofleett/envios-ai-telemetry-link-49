
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCountryMarketplaceSettings } from "@/hooks/useCountryMarketplaceSettings";
import { CountryMarketplaceSettings } from "@/types/country-marketplace-settings";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: CountryMarketplaceSettings | null;
}

const formSchema = z.object({
  country_code: z.string().min(2).max(2, "Country code must be 2 characters"),
  default_commission_rate: z.coerce.number().min(0),
  default_registration_fee: z.coerce.number().min(0),
  currency: z.string().min(3).max(3, "Currency must be 3 characters"),
  billing_cycles: z.array(z.string()).refine(value => value.length > 0, "Select at least one billing cycle"),
  supported_payment_methods: z.array(z.string()).refine(value => value.length > 0, "Select at least one payment method"),
});

const ALL_BILLING_CYCLES = ["monthly", "quarterly", "yearly"];
const ALL_PAYMENT_METHODS = ["card", "bank_transfer", "crypto"];

export const CountryMarketplaceSettingsDialog: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { saveCountrySettings, isSaving } = useCountryMarketplaceSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(initialData || {
        country_code: "US",
        default_commission_rate: 10,
        default_registration_fee: 100,
        currency: "USD",
        billing_cycles: ["monthly", "yearly"],
        supported_payment_methods: ["card"],
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: Partial<CountryMarketplaceSettings> & { country_code: string } = {
        ...initialData,
        ...values,
        id: initialData?.id
    };
    saveCountrySettings(payload, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Configure"} Country Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="country_code">Country Code (2-letter)</Label>
            <Input id="country_code" {...form.register("country_code")} />
            {form.formState.errors.country_code && <p className="text-destructive text-sm">{form.formState.errors.country_code.message}</p>}
          </div>
          <div>
            <Label htmlFor="default_commission_rate">Default Commission Rate (%)</Label>
            <Input id="default_commission_rate" type="number" step="0.01" {...form.register("default_commission_rate")} />
            {form.formState.errors.default_commission_rate && <p className="text-destructive text-sm">{form.formState.errors.default_commission_rate.message}</p>}
          </div>
          <div>
            <Label htmlFor="default_registration_fee">Default Registration Fee</Label>
            <Input id="default_registration_fee" type="number" step="0.01" {...form.register("default_registration_fee")} />
            {form.formState.errors.default_registration_fee && <p className="text-destructive text-sm">{form.formState.errors.default_registration_fee.message}</p>}
          </div>
          <div>
            <Label htmlFor="currency">Currency (3-letter)</Label>
            <Input id="currency" {...form.register("currency")} />
            {form.formState.errors.currency && <p className="text-destructive text-sm">{form.formState.errors.currency.message}</p>}
          </div>
          <div>
            <Label>Billing Cycles</Label>
            <div className="space-y-2">
                {ALL_BILLING_CYCLES.map(cycle => (
                    <div key={cycle} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`cycle-${cycle}`}
                            checked={form.watch("billing_cycles")?.includes(cycle)}
                            onCheckedChange={(checked) => {
                                const current = form.getValues("billing_cycles") || [];
                                const newCycles = checked ? [...current, cycle] : current.filter(c => c !== cycle);
                                form.setValue("billing_cycles", newCycles, { shouldValidate: true });
                            }}
                        />
                        <Label htmlFor={`cycle-${cycle}`} className="font-normal capitalize">{cycle}</Label>
                    </div>
                ))}
            </div>
            {form.formState.errors.billing_cycles && <p className="text-destructive text-sm">{form.formState.errors.billing_cycles.message}</p>}
          </div>
          <div>
            <Label>Supported Payment Methods</Label>
            <div className="space-y-2">
                {ALL_PAYMENT_METHODS.map(method => (
                    <div key={method} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`method-${method}`}
                            checked={form.watch("supported_payment_methods")?.includes(method)}
                            onCheckedChange={(checked) => {
                                const current = form.getValues("supported_payment_methods") || [];
                                const newMethods = checked ? [...current, method] : current.filter(m => m !== method);
                                form.setValue("supported_payment_methods", newMethods, { shouldValidate: true });
                            }}
                        />
                        <Label htmlFor={`method-${method}`} className="font-normal capitalize">{method.replace('_', ' ')}</Label>
                    </div>
                ))}
            </div>
            {form.formState.errors.supported_payment_methods && <p className="text-destructive text-sm">{form.formState.errors.supported_payment_methods.message}</p>}
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
