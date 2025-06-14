
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApplicationFormValues } from './schema';

const ApplicationFormFields: React.FC = () => {
    const { control } = useFormContext<ApplicationFormValues>();

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="org_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your Company LLC" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="contact_email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="business_address"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                            <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="website_url"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="business_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Type</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Corporation, LLC" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="business_registration_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Registration ID</FormLabel>
                            <FormControl>
                                <Input placeholder="Your business registration number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={control}
                name="tax_id"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tax ID (e.g., EIN)</FormLabel>
                        <FormControl>
                            <Input placeholder="Your Tax ID" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

export default ApplicationFormFields;
