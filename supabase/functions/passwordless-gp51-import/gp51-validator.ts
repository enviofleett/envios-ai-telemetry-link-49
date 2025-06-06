
export interface GP51ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateGP51Connection(): Promise<GP51ValidationResult> {
  const result: GP51ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    const gp51BaseUrl = Deno.env.get('GP51_API_BASE_URL');
    
    if (!gp51BaseUrl) {
      result.isValid = false;
      result.errors.push('GP51_API_BASE_URL not configured in environment');
      return result;
    }

    console.log('Testing GP51 connectivity to:', gp51BaseUrl);
    
    // Test basic connectivity to GP51
    try {
      const response = await fetch(`${gp51BaseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        result.warnings.push(`GP51 health check returned status ${response.status}`);
      } else {
        console.log('GP51 connectivity test passed');
      }
    } catch (error) {
      console.log('GP51 health check failed (expected for some configurations):', error.message);
      result.warnings.push('GP51 health check endpoint not available');
    }

    return result;

  } catch (error) {
    console.error('GP51 validation failed:', error);
    result.isValid = false;
    result.errors.push(`Validation failed: ${error.message}`);
    return result;
  }
}
