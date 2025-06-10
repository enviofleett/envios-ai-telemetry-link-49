
import { z } from 'zod';

// JSON validation and sanitization
export function sanitizeJSON(rawData: any): any {
  try {
    // Handle null, undefined, or empty values
    if (rawData === null || rawData === undefined || rawData === '') {
      return {};
    }
    
    // If it's already an object, validate it
    if (typeof rawData === 'object') {
      return JSON.parse(JSON.stringify(rawData));
    }
    
    // If it's a string, try to parse it
    if (typeof rawData === 'string') {
      // Clean common JSON issues
      const cleaned = rawData
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"') // Escape quotes properly
        .trim();
      
      return JSON.parse(cleaned);
    }
    
    return rawData;
  } catch (error) {
    console.error('Malformed JSON detected:', { rawData, error: error.message });
    return {};
  }
}

// GP51 Position validation schema
const GP51PositionSchema = z.object({
  deviceid: z.union([z.string(), z.number()]).transform(String),
  callat: z.number().optional().default(0),
  callon: z.number().optional().default(0),
  speed: z.number().optional().default(0),
  course: z.number().optional().default(0),
  updatetime: z.union([z.string(), z.number()]).optional(),
  strstatus: z.string().optional().default(''),
  strstatusen: z.string().optional().default('Unknown'),
}).passthrough(); // Allow additional fields

export function validateGP51Position(data: any): { valid: boolean; data?: any; error?: string } {
  try {
    const sanitized = sanitizeJSON(data);
    const validated = GP51PositionSchema.parse(sanitized);
    
    return {
      valid: true,
      data: validated
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      data: null
    };
  }
}

// Vehicle data validation for Supabase
export function validateVehicleData(vehicleData: any): { valid: boolean; data?: any; error?: string } {
  try {
    const cleaned = {
      device_id: String(vehicleData.device_id || vehicleData.deviceid || ''),
      device_name: String(vehicleData.device_name || vehicleData.devicename || ''),
      last_position: sanitizeJSON(vehicleData.last_position || {}),
      updated_at: new Date().toISOString(),
      is_active: Boolean(vehicleData.is_active !== false), // Default to true unless explicitly false
    };
    
    // Ensure device_id is not empty
    if (!cleaned.device_id) {
      return {
        valid: false,
        error: 'Device ID is required'
      };
    }
    
    return {
      valid: true,
      data: cleaned
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Vehicle data validation failed'
    };
  }
}

// Batch validation for multiple items
export function validateBatch<T>(
  items: any[], 
  validator: (item: any) => { valid: boolean; data?: T; error?: string }
): { valid: T[]; invalid: Array<{ item: any; error: string }> } {
  const valid: T[] = [];
  const invalid: Array<{ item: any; error: string }> = [];
  
  items.forEach((item, index) => {
    const result = validator(item);
    if (result.valid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({
        item: { ...item, index },
        error: result.error || 'Unknown validation error'
      });
    }
  });
  
  return { valid, invalid };
}
