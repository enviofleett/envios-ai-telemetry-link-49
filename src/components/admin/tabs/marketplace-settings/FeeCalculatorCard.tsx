
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeeCalculator } from '@/hooks/useFeeCalculator';
import { useMerchants } from '@/hooks/useMerchants';

export const FeeCalculatorCard = () => {
    const [merchantId, setMerchantId] = useState<string | undefined>();
    const [categoryId, setCategoryId] = useState('');
    const [countryCode, setCountryCode] = useState('US');
    const [result, setResult] = useState<any>(null);

    const { calculateFees, isLoading: isLoadingCalculator } = useFeeCalculator();
    const { data: merchants, isLoading: isLoadingMerchants } = useMerchants();

    const handleCalculate = () => {
        const fees = calculateFees({ merchantId, categoryId, countryCode });
        setResult(fees);
    };

    const isLoading = isLoadingCalculator || isLoadingMerchants;

    return (
        <Card className="max-w-4xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Fee Calculator & Preview</CardTitle>
                <CardDescription>
                    Test the fee calculation engine by providing different contexts. The engine prioritizes fees in this order: Merchant Override → Category Rate → Country Default → Global Default.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="merchant-select">Merchant (Optional)</Label>
                        <Select onValueChange={(val) => setMerchantId(val === 'clear' ? undefined : val)} value={merchantId}>
                            <SelectTrigger id="merchant-select">
                                <SelectValue placeholder="Select a merchant" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="clear">-- No Merchant --</SelectItem>
                                {merchants?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category-id-input">Category ID (Optional)</Label>
                        <Input id="category-id-input" value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="e.g., electronics" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="country-code-input">Country Code</Label>
                        <Input id="country-code-input" value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase())} placeholder="e.g., US" />
                    </div>
                </div>
                <Button onClick={handleCalculate} disabled={isLoading}>
                    {isLoading ? 'Loading Settings...' : 'Calculate Fees'}
                </Button>

                {result && (
                    <div className="pt-4 mt-4 border-t">
                        <h3 className="font-semibold text-lg mb-2">Calculation Result</h3>
                        <div className="p-4 bg-muted rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Commission Rate</p>
                                <p className="text-xl font-bold">{result.commissionRate ?? 'N/A'}%</p>
                                <p className="text-xs text-gray-500">Source: {result.commissionRateSource}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Registration Fee</p>
                                <p className="text-xl font-bold">{result.registrationFee?.toLocaleString() ?? 'N/A'} {result.currency}</p>
                                <p className="text-xs text-gray-500">Source: {result.registrationFeeSource}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
