import React, { useMemo, useCallback } from 'react';
import { useMerchantOnboardingData } from '@/hooks/useMerchantOnboardingData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const CategorySelector: React.FC = () => {
    const { categories, settings, isLoading, isError, error } = useMerchantOnboardingData();
    const { watch, setValue, getValues } = useFormContext();
    
    const selectedCategoryIds = watch('selected_category_ids', []);

    const feeDetails = useMemo(() => {
        if (!settings) return { fee: 0, message: '', registration_fee: 0, additionalFee: 0 };
        const { 
            free_categories_included = 2, 
            additional_category_fee = 0, 
            registration_fee = 0, 
            currency = 'USD' 
        } = settings;
        const selectedCount = selectedCategoryIds.length;
        const additionalCategories = Math.max(0, selectedCount - free_categories_included);
        const additionalFee = additionalCategories * additional_category_fee;
        const totalFee = (registration_fee || 0) + additionalFee;

        let message = `Includes ${free_categories_included} free categor${free_categories_included === 1 ? 'y' : 'ies'}. Each additional category costs ${currency} ${additional_category_fee.toFixed(2)}.`;
        if (selectedCount > free_categories_included) {
            message += ` You have selected ${additionalCategories} additional categor${additionalCategories > 1 ? 'ies' : 'y'}.`;
        }
        
        return { fee: totalFee, message, registration_fee: registration_fee || 0, additionalFee };
    }, [selectedCategoryIds, settings]);

    if (isLoading) {
        return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Loading categories...</div>;
    }

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load merchant categories or settings. Please try again later. Error: {(error as Error)?.message}</AlertDescription>
            </Alert>
        );
    }

    const handleCategoryToggle = useCallback((categoryId: string) => {
        const currentSelection = getValues('selected_category_ids') || [];
        const newSelection = currentSelection.includes(categoryId)
            ? currentSelection.filter((id: string) => id !== categoryId)
            : [...currentSelection, categoryId];
        setValue('selected_category_ids', newSelection, { shouldDirty: true, shouldValidate: true });
    }, [getValues, setValue]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Business Categories</h3>
            <p className="text-sm text-muted-foreground">{feeDetails.message}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories?.map((category) => (
                    <Card 
                        key={category.id} 
                        className={`cursor-pointer transition-all ${selectedCategoryIds.includes(category.id) ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`} 
                        onClick={() => handleCategoryToggle(category.id)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {settings && (
                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm mt-4">
                    <div className="flex justify-between"><span>Base Registration Fee:</span> <span>{settings.currency} {feeDetails.registration_fee?.toFixed(2)}</span></div>
                    {feeDetails.additionalFee > 0 && <div className="flex justify-between"><span>Additional Category Fee:</span> <span>{settings.currency} {feeDetails.additionalFee?.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total Fee:</span> <span>{settings.currency} {feeDetails.fee?.toFixed(2)}</span></div>
                </div>
            )}
        </div>
    );
};

export default CategorySelector;
