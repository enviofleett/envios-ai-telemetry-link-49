
import { createSuccessResponse, createErrorResponse, calculateLatency } from './response-utils.ts';

interface GP51UserMappingRequest {
  action: string;
  username?: string;
  password?: string;
  mappingId?: string;
  targetUsername?: string;
}

export async function handleGP51UserMappingOperations(
  adminSupabase: any,
  action: string,
  body: GP51UserMappingRequest,
  userId: string
) {
  const startTime = Date.now();
  
  try {
    console.log(`🔧 [GP51-USER-MAPPING] Handling action: ${action}`);
    
    switch (action) {
      case 'get-user-mappings':
        return await handleGetUserMappings(adminSupabase, userId, startTime);
      
      case 'create-mapping':
        if (!body.username || !body.password) {
          return createErrorResponse(
            'Missing required fields',
            'Username and password are required for creating mappings',
            400,
            calculateLatency(startTime)
          );
        }
        return await handleCreateMapping(adminSupabase, userId, body.username, body.password, startTime);
      
      case 'verify-mapping':
        if (!body.mappingId) {
          return createErrorResponse(
            'Missing mapping ID',
            'Mapping ID is required for verification',
            400,
            calculateLatency(startTime)
          );
        }
        return await handleVerifyMapping(adminSupabase, body.mappingId, startTime);
      
      case 'delete-mapping':
        if (!body.mappingId) {
          return createErrorResponse(
            'Missing mapping ID',
            'Mapping ID is required for deletion',
            400,
            calculateLatency(startTime)
          );
        }
        return await handleDeleteMapping(adminSupabase, userId, body.mappingId, startTime);
      
      case 'migrate-existing-users':
        return await handleMigrateExistingUsers(adminSupabase, userId, startTime);
      
      default:
        return createErrorResponse(
          `Unknown user mapping action: ${action}`,
          undefined,
          400,
          calculateLatency(startTime)
        );
    }
  } catch (error) {
    console.error(`❌ [GP51-USER-MAPPING] Error in ${action}:`, error);
    return createErrorResponse(
      'User mapping operation failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function handleGetUserMappings(adminSupabase: any, userId: string, startTime: number) {
  try {
    const { data: mappings, error } = await adminSupabase
      .from('gp51_user_mappings')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch user mappings:', error);
      return createErrorResponse(
        'Failed to fetch user mappings',
        error.message,
        500,
        calculateLatency(startTime)
      );
    }

    return createSuccessResponse({
      mappings: mappings || [],
      total: mappings?.length || 0
    }, calculateLatency(startTime));
  } catch (error) {
    return createErrorResponse(
      'Database error',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function handleCreateMapping(
  adminSupabase: any, 
  userId: string, 
  username: string, 
  password: string, 
  startTime: number
) {
  try {
    // Check if mapping already exists
    const { data: existing } = await adminSupabase
      .from('gp51_user_mappings')
      .select('id')
      .eq('envio_user_id', userId)
      .eq('gp51_username', username)
      .single();

    if (existing) {
      return createErrorResponse(
        'Mapping already exists',
        `A mapping for username "${username}" already exists`,
        409,
        calculateLatency(startTime)
      );
    }

    // Create new mapping
    const { data: mapping, error } = await adminSupabase
      .from('gp51_user_mappings')
      .insert({
        envio_user_id: userId,
        gp51_username: username,
        is_verified: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create user mapping:', error);
      return createErrorResponse(
        'Failed to create mapping',
        error.message,
        500,
        calculateLatency(startTime)
      );
    }

    return createSuccessResponse({
      mapping,
      message: `User mapping created for ${username}`
    }, calculateLatency(startTime));
  } catch (error) {
    return createErrorResponse(
      'Mapping creation failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function handleVerifyMapping(adminSupabase: any, mappingId: string, startTime: number) {
  try {
    const { data: mapping, error } = await adminSupabase
      .from('gp51_user_mappings')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', mappingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to verify mapping:', error);
      return createErrorResponse(
        'Failed to verify mapping',
        error.message,
        500,
        calculateLatency(startTime)
      );
    }

    return createSuccessResponse({
      mapping,
      message: 'User mapping verified successfully'
    }, calculateLatency(startTime));
  } catch (error) {
    return createErrorResponse(
      'Mapping verification failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function handleDeleteMapping(
  adminSupabase: any, 
  userId: string, 
  mappingId: string, 
  startTime: number
) {
  try {
    const { error } = await adminSupabase
      .from('gp51_user_mappings')
      .delete()
      .eq('id', mappingId)
      .eq('envio_user_id', userId);

    if (error) {
      console.error('❌ Failed to delete mapping:', error);
      return createErrorResponse(
        'Failed to delete mapping',
        error.message,
        500,
        calculateLatency(startTime)
      );
    }

    return createSuccessResponse({
      message: 'User mapping deleted successfully'
    }, calculateLatency(startTime));
  } catch (error) {
    return createErrorResponse(
      'Mapping deletion failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function handleMigrateExistingUsers(adminSupabase: any, userId: string, startTime: number) {
  try {
    // This would implement migration logic for existing GP51 users
    // For now, return a placeholder response
    return createSuccessResponse({
      message: 'User migration functionality not yet implemented',
      migrated: 0
    }, calculateLatency(startTime));
  } catch (error) {
    return createErrorResponse(
      'Migration failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}
