
export class GP51ErrorHandler {
  static createDetailedError(error: any, context: any = {}) {
    return {
      message: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString()
    };
  }

  static logError(error: any, context: any = {}) {
    console.error('🚨 GP51 Error:', {
      error: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString()
    });
  }

  static formatErrorForClient(error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || 'No additional details available'
    };
  }
}
