
export async function autoLinkUserVehicles(supabase: any, userId: string, gp51Username?: string): Promise<number> {
  // Validate GP51 username before processing
  if (!gp51Username || 
      gp51Username.trim() === '' || 
      gp51Username === 'User') {
    console.log(`Invalid GP51 username provided for user ${userId}: "${gp51Username}". Skipping auto-link.`);
    return 0;
  }

  try {
    // Find unassigned vehicles for this GP51 username
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, device_id')
      .eq('gp51_username', gp51Username)
      .is('envio_user_id', null)
      .eq('is_active', true);

    if (vehiclesError) {
      console.error('Error fetching vehicles for auto-link:', vehiclesError);
      return 0;
    }

    if (!vehicles || vehicles.length === 0) {
      console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
      return 0;
    }

    // Link all matching vehicles to the user
    const { error: linkError } = await supabase
      .from('vehicles')
      .update({ 
        envio_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('gp51_username', gp51Username)
      .is('envio_user_id', null);

    if (linkError) {
      console.error(`Failed to auto-link vehicles for user ${userId}:`, linkError);
      return 0;
    }

    console.log(`Auto-linked ${vehicles.length} vehicles to user ${userId} (GP51: ${gp51Username})`);
    return vehicles.length;

  } catch (error) {
    console.error(`Auto-link failed for user ${userId}:`, error);
    return 0;
  }
}
