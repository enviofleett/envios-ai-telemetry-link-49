
import { z } from 'zod';

// Base GP51 Response Schema
export const GP51BaseResponseSchema = z.object({
  status: z.number(),
  cause: z.string().optional()
});

// Authentication Response Schema
export const GP51AuthResponseSchema = GP51BaseResponseSchema.extend({
  token: z.string().optional(),
  message: z.string().optional()
});

// Device/Vehicle Schema
export const GP51VehicleSchema = z.object({
  deviceid: z.number(),
  devicename: z.string(),
  devicetype: z.number(),
  groupid: z.number(),
  username: z.string(),
  devicestatus: z.number(),
  overduetime: z.string(),
  timezone: z.number(),
  icontype: z.number(),
  offline_delay: z.number(),
  lastupdate: z.string(),
  lat: z.number(),
  lng: z.number(),
  speed: z.number(),
  course: z.number(),
  acc: z.number(),
  oil: z.number(),
  temperature: z.number(),
  gsm: z.number(),
  gps: z.number()
});

// Vehicles Response Schema
export const GP51VehiclesResponseSchema = GP51BaseResponseSchema.extend({
  devicelist: z.array(GP51VehicleSchema).optional()
});

// Position Data Schema
export const GP51PositionSchema = z.object({
  deviceid: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number(),
  course: z.number(),
  timestamp: z.string(),
  acc: z.number().optional(),
  gsm: z.number().optional(),
  gps: z.number().optional(),
  oil: z.number().optional(),
  temperature: z.number().optional()
});

// User Data Schema
export const GP51UserSchema = z.object({
  username: z.string(),
  creater: z.string(),
  showname: z.string(),
  usertype: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  multilogin: z.union([z.literal(0), z.literal(1)]),
  companyname: z.string().optional(),
  companyaddr: z.string().optional(),
  cardname: z.string().optional(),
  email: z.string().email().optional(),
  wechat: z.string().optional(),
  phone: z.string().optional(),
  qq: z.string().optional()
});

// Device Type Schema
export const GP51DeviceTypeSchema = z.object({
  defaultidlength: z.number(),
  defaultofflinedelay: z.number(),
  devicetypeid: z.number(),
  functions: z.number(),
  functionslong: z.number(),
  price: z.number(),
  price3: z.number(),
  price5: z.number(),
  price10: z.number(),
  remark: z.string(),
  remarken: z.string(),
  typecode: z.string(),
  typename: z.string()
});

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  receivedValue?: any;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  rawData?: any;
}

// Enhanced Validator Class
export class GP51ResponseValidator {
  private static instance: GP51ResponseValidator;

  static getInstance(): GP51ResponseValidator {
    if (!GP51ResponseValidator.instance) {
      GP51ResponseValidator.instance = new GP51ResponseValidator();
    }
    return GP51ResponseValidator.instance;
  }

  validateAuthResponse(data: any): ValidationResult<z.infer<typeof GP51AuthResponseSchema>> {
    return this.validateWithSchema(GP51AuthResponseSchema, data, 'AuthResponse');
  }

  validateVehiclesResponse(data: any): ValidationResult<z.infer<typeof GP51VehiclesResponseSchema>> {
    return this.validateWithSchema(GP51VehiclesResponseSchema, data, 'VehiclesResponse');
  }

  validateVehicle(data: any): ValidationResult<z.infer<typeof GP51VehicleSchema>> {
    return this.validateWithSchema(GP51VehicleSchema, data, 'Vehicle');
  }

  validatePosition(data: any): ValidationResult<z.infer<typeof GP51PositionSchema>> {
    return this.validateWithSchema(GP51PositionSchema, data, 'Position');
  }

  validateUser(data: any): ValidationResult<z.infer<typeof GP51UserSchema>> {
    return this.validateWithSchema(GP51UserSchema, data, 'User');
  }

  validateDeviceType(data: any): ValidationResult<z.infer<typeof GP51DeviceTypeSchema>> {
    return this.validateWithSchema(GP51DeviceTypeSchema, data, 'DeviceType');
  }

  private validateWithSchema<T>(schema: z.ZodSchema<T>, data: any, context: string): ValidationResult<T> {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          errors: []
        };
      } else {
        const errors: ValidationError[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          receivedValue: err.received
        }));

        console.error(`GP51 ${context} validation failed:`, errors);
        
        return {
          success: false,
          errors,
          rawData: data
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'root',
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'validation_exception'
        }],
        rawData: data
      };
    }
  }

  // Batch validation for arrays
  validateVehicleArray(vehicles: any[]): {
    valid: z.infer<typeof GP51VehicleSchema>[];
    invalid: { data: any; errors: ValidationError[] }[];
  } {
    const valid: z.infer<typeof GP51VehicleSchema>[] = [];
    const invalid: { data: any; errors: ValidationError[] }[] = [];

    vehicles.forEach(vehicle => {
      const result = this.validateVehicle(vehicle);
      if (result.success && result.data) {
        valid.push(result.data);
      } else {
        invalid.push({ data: vehicle, errors: result.errors });
      }
    });

    return { valid, invalid };
  }

  // Deep validation with custom rules
  validateWithBusinessRules(data: any, type: 'vehicle' | 'user' | 'position'): ValidationResult<any> {
    const baseValidation = this.getBaseValidation(data, type);
    
    if (!baseValidation.success) {
      return baseValidation;
    }

    // Apply business rules
    const businessErrors = this.applyBusinessRules(baseValidation.data!, type);
    
    if (businessErrors.length > 0) {
      return {
        success: false,
        errors: [...baseValidation.errors, ...businessErrors],
        rawData: data
      };
    }

    return baseValidation;
  }

  private getBaseValidation(data: any, type: string): ValidationResult<any> {
    switch (type) {
      case 'vehicle':
        return this.validateVehicle(data);
      case 'user':
        return this.validateUser(data);
      case 'position':
        return this.validatePosition(data);
      default:
        throw new Error(`Unknown validation type: ${type}`);
    }
  }

  private applyBusinessRules(data: any, type: string): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (type) {
      case 'vehicle':
        // Vehicle business rules
        if (data.lat === 0 && data.lng === 0) {
          errors.push({
            field: 'coordinates',
            message: 'Vehicle coordinates cannot both be zero',
            code: 'invalid_coordinates'
          });
        }
        
        if (data.speed < 0 || data.speed > 300) {
          errors.push({
            field: 'speed',
            message: 'Vehicle speed must be between 0 and 300 km/h',
            code: 'invalid_speed'
          });
        }
        break;

      case 'user':
        // User business rules
        if (data.username && data.username.length < 3) {
          errors.push({
            field: 'username',
            message: 'Username must be at least 3 characters long',
            code: 'username_too_short'
          });
        }
        break;

      case 'position':
        // Position business rules
        if (Math.abs(data.latitude) > 90 || Math.abs(data.longitude) > 180) {
          errors.push({
            field: 'coordinates',
            message: 'Invalid GPS coordinates',
            code: 'invalid_gps'
          });
        }
        break;
    }

    return errors;
  }
}

export const gp51Validator = GP51ResponseValidator.getInstance();
