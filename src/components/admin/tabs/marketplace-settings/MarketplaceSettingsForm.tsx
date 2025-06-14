
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarketplaceSettings } from "@/types/marketplace-settings";

interface Props {
  form: MarketplaceSettings;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  hasId: boolean;
}

const MarketplaceSettingsForm: React.FC<Props> = ({
  form,
  handleChange,
  handleSave,
  isSaving,
  hasId,
}) => (
  <form onSubmit={handleSave} className="space-y-4">
    <div>
      <label className="font-medium" htmlFor="commission_rate">
        Default Commission Rate (%)
      </label>
      <Input
        id="commission_rate"
        name="commission_rate"
        type="number"
        step="0.01"
        value={form.commission_rate}
        onChange={handleChange}
        min={0}
        max={100}
        required
        className="mt-1"
      />
    </div>
    <div>
      <label className="font-medium" htmlFor="registration_fee">
        Registration Fee
      </label>
      <Input
        id="registration_fee"
        name="registration_fee"
        type="number"
        step="0.01"
        value={form.registration_fee}
        onChange={handleChange}
        min={0}
        required
        className="mt-1"
      />
    </div>
    <div>
      <label className="font-medium" htmlFor="connection_fee">
        Connection Fee (per vehicle)
      </label>
      <Input
        id="connection_fee"
        name="connection_fee"
        type="number"
        step="0.01"
        value={form.connection_fee}
        onChange={handleChange}
        min={0}
        required
        className="mt-1"
      />
    </div>
    <div>
      <label className="font-medium" htmlFor="currency">
        Currency
      </label>
      <Input
        id="currency"
        name="currency"
        type="text"
        maxLength={6}
        value={form.currency}
        onChange={handleChange}
        required
        className="mt-1"
      />
    </div>
    <div className="pt-6 flex">
      <Button type="submit" className="ml-auto" disabled={isSaving}>
        {hasId ? "Update Settings" : "Create Settings"}
      </Button>
    </div>
  </form>
);

export default MarketplaceSettingsForm;
