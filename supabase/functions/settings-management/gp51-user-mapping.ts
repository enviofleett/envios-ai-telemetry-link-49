
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createSuccessResponse, createErrorResponse } from './response-utils.ts';

export async function handleGP51UserMappingOperations(
  adminSupabase: any,
  action: string,
  requestBody: any,
  userId: string
) {
  try {
    switch (action) {
      case 'get-user-mappings':
        return await getUserMappings(adminSupabase, userId);
      
      case 'create-mapping':
        return await createUserMapping(adminSupabase, userId, requestBody);
      
      case 'verify-mapping':
        return await verifyUserMapping(adminSupabase, requestBody.mappingId);
      
      case 'delete-mapping':
        return await deleteUserMapping(adminSupabase, requestBody.mappingId);
      
      case 'migrate-existing-users':
        return await migrateExistingUsers(adminSupabase);
      
      default:
        return createErrorResponse(`Unknown GP51 user mapping action: ${action}`, undefined, 400);
    }
  } catch (error) {
    console.error('GP51 user mapping operation error:', error);
    return createErrorResponse(
      'Failed to process GP51 user mapping operation',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

async function getUserMappings(adminSupabase: any, userId: string) {
  const { data: envioUser, error: userError } = await adminSupabase
    .from('envio_users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !envioUser) {
    return createErrorResponse('User not found', userError?.message, 404);
  }

  const { data: mappings, error: mappingsError } = await adminSupabase
    .from('gp51_user_mappings')
    .select('*')
    .eq('envio_user_id', envioUser.id)
    .order('created_at', { ascending: false });

  if (mappingsError) {
    return createErrorResponse('Failed to fetch user mappings', mappingsError.message, 500);
  }

  return createSuccessResponse({ mappings: mappings || [] });
}

async function createUserMapping(adminSupabase: any, userId: string, requestBody: any) {
  const { gp51Username, userType = 3, mappingType = 'manual' } = requestBody;

  if (!gp51Username) {
    return createErrorResponse('GP51 username is required', undefined, 400);
  }

  const { data: envioUser, error: userError } = await adminSupabase
    .from('envio_users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !envioUser) {
    return createErrorResponse('User not found', userError?.message, 404);
  }

  const { data: mapping, error: mappingError } = await adminSupabase
    .from('gp51_user_mappings')
    .insert({
      envio_user_id: envioUser.id,
      gp51_username: gp51Username,
      gp51_user_type: userType,
      mapping_type: mappingType,
      is_verified: false
    })
    .select()
    .single();

  if (mappingError) {
    return createErrorResponse('Failed to create user mapping', mappingError.message, 500);
  }

  return createSuccessResponse({ mapping });
}

async function verifyUserMapping(adminSupabase: any, mappingId: string) {
  if (!mappingId) {
    return createErrorResponse('Mapping ID is required', undefined, 400);
  }

  const { data: mapping, error: mappingError } = await adminSupabase
    .from('gp51_user_mappings')
    .update({ is_verified: true })
    .eq('id', mappingId)
    .select()
    .single();

  if (mappingError) {
    return createErrorResponse('Failed to verify user mapping', mappingError.message, 500);
  }

  return createSuccessResponse({ mapping });
}

async function deleteUserMapping(adminSupabase: any, mappingId: string) {
  if (!mappingId) {
    return createErrorResponse('Mapping ID is required', undefined, 400);
  }

  const { error: deleteError } = await adminSupabase
    .from('gp51_user_mappings')
    .delete()
    .eq('id', mappingId);

  if (deleteError) {
    return createErrorResponse('Failed to delete user mapping', deleteError.message, 500);
  }

  return createSuccessResponse({ message: 'User mapping deleted successfully' });
}

async function migrateExistingUsers(adminSupabase: any) {
  // Get users with GP51 usernames that don't have mappings yet
  const { data: users, error: fetchError } = await adminSupabase
    .from('envio_users')
    .select('id, gp51_username, gp51_user_type')
    .not('gp51_username', 'is', null)
    .neq('gp51_username', '');

  if (fetchError) {
    return createErrorResponse('Failed to fetch users for migration', fetchError.message, 500);
  }

  if (!users || users.length === 0) {
    return createSuccessResponse({ message: 'No users to migrate', migrated: 0 });
  }

  const mappings = users.map(user => ({
    envio_user_id: user.id,
    gp51_username: user.gp51_username,
    gp51_user_type: user.gp51_user_type || 3,
    mapping_type: 'migrated',
    is_verified: true
  }));

  const { error: insertError } = await adminSupabase
    .from('gp51_user_mappings')
    .upsert(mappings, { onConflict: 'envio_user_id,gp51_username' });

  if (insertError) {
    return createErrorResponse('Failed to migrate users', insertError.message, 500);
  }

  return createSuccessResponse({ 
    message: `Successfully migrated ${users.length} GP51 user mappings`,
    migrated: users.length 
  });
}
