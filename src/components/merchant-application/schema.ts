
import * as z from 'zod';

export const applicationSchema = z.object({
  org_name: z.string().min(2, { message: "Organization name is required." }),
  contact_email: z.string().email({ message: "A valid contact email is required." }),
  business_address: z.string().optional(),
  website_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  business_type: z.string().optional(),
  business_registration_id: z.string().optional(),
  tax_id: z.string().optional(),
  selected_category_ids: z.array(z.string()).min(1, { message: "Please select at least one business category." }).default([]),
  total_fee: z.number().optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
