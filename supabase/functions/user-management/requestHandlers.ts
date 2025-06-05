
import { corsHeaders } from './cors.ts';
import { getCurrentUser } from './auth.ts';
import { getUserWithDetails, getUsersWithPagination } from './userQueries.ts';
import { createUser, updateUser, deleteUser } from './userOperations.ts';
import { getCurrentUserRole, updateUserRole } from './roleOperations.ts';

export async function handleGetRequest(supabase: any, url: URL, currentUserId: string | null) {
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  // Get pagination parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search') || '';

  console.log('Request params:', { page, limit, search });

  // Handle role-specific endpoints
  if (pathSegments.includes('roles')) {
    if (!currentUserId) {
      throw new Error('Authentication required');
    }

    const userId = pathSegments[pathSegments.length - 1];
    
    if (userId === 'current') {
      return getCurrentUserRole(supabase, currentUserId);
    }
  }

  // Get all users or specific user
  const userId = pathSegments[pathSegments.length - 1];
  
  if (userId && userId !== 'user-management') {
    const user = await getUserWithDetails(supabase, userId);
    return { user };
  } else {
    return await getUsersWithPagination(supabase, page, limit, search);
  }
}

export async function handlePostRequest(supabase: any, req: Request, currentUserId: string | null) {
  const requestBody = await req.text();
  
  if (!requestBody) {
    throw new Error('Request body is required');
  }

  const userData = JSON.parse(requestBody);
  const result = await createUser(supabase, userData, currentUserId!);
  
  return new Response(
    JSON.stringify(result),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function handlePutRequest(supabase: any, req: Request, url: URL, currentUserId: string | null) {
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const userId = pathSegments[pathSegments.length - 1];
  const requestBody = await req.text();
  
  if (!requestBody) {
    throw new Error('Request body is required');
  }

  const bodyData = JSON.parse(requestBody);

  // Handle role updates
  if (pathSegments.includes('role')) {
    const { role } = bodyData;
    await updateUserRole(supabase, userId, role, currentUserId!);
    
    return new Response(
      JSON.stringify({ message: 'User role updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Handle regular user updates
  const user = await updateUser(supabase, userId, bodyData, currentUserId!);
  
  return new Response(
    JSON.stringify({ user }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function handleDeleteRequest(supabase: any, url: URL, currentUserId: string | null) {
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const userId = pathSegments[pathSegments.length - 1];

  await deleteUser(supabase, userId, currentUserId!);

  return new Response(
    JSON.stringify({ message: 'User deleted successfully' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
