
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../gp51-service-management/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 [DATA-CONSISTENCY] Starting consistency check...');

    // Start monitoring record
    const { data: monitoring, error: monitoringError } = await supabase
      .from('data_consistency_monitoring')
      .insert({
        check_type: 'scheduled_full_sync',
        status: 'running'
      })
      .select()
      .single();

    if (monitoringError) {
      console.error('❌ Failed to create monitoring record:', monitoringError);
      throw monitoringError;
    }

    const discrepancies = [];
    let totalEntitiesChecked = 0;
    let autoResolved = 0;

    // Check 1: Vehicle data consistency
    console.log('🚗 Checking vehicle consistency...');
    
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*');

    if (vehiclesError) {
      console.error('❌ Failed to fetch vehicles:', vehiclesError);
      throw vehiclesError;
    }

    totalEntitiesChecked += vehicles?.length || 0;

    // Check for duplicate device IDs
    const deviceIdMap = new Map();
    vehicles?.forEach(vehicle => {
      if (vehicle.gp51_device_id) {
        const existing = deviceIdMap.get(vehicle.gp51_device_id);
        if (existing) {
          discrepancies.push({
            discrepancy_type: 'data_mismatch',
            entity_type: 'vehicle',
            entity_id: vehicle.gp51_device_id,
            severity: 'high',
            local_data: { 
              duplicateVehicles: [existing.id, vehicle.id],
              deviceId: vehicle.gp51_device_id 
            }
          });
        } else {
          deviceIdMap.set(vehicle.gp51_device_id, vehicle);
        }
      }
    });

    // Check for vehicles without device IDs
    const vehiclesWithoutDeviceId = vehicles?.filter(v => !v.gp51_device_id) || [];
    vehiclesWithoutDeviceId.forEach(vehicle => {
      discrepancies.push({
        discrepancy_type: 'missing_vehicle',
        entity_type: 'vehicle',
        entity_id: vehicle.id,
        severity: 'medium',
        local_data: {
          vehicleId: vehicle.id,
          vehicleName: vehicle.vehicle_name
        }
      });
    });

    // Check 2: User mapping consistency
    console.log('👥 Checking user mapping consistency...');
    
    const { data: orphanedSessions, error: sessionsError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .is('envio_user_id', null);

    if (sessionsError) {
      console.error('❌ Failed to fetch orphaned sessions:', sessionsError);
      throw sessionsError;
    }

    totalEntitiesChecked += orphanedSessions?.length || 0;

    orphanedSessions?.forEach(session => {
      discrepancies.push({
        discrepancy_type: 'orphaned_record',
        entity_type: 'user',
        entity_id: session.username,
        severity: 'low',
        gp51_data: {
          sessionId: session.id,
          username: session.username,
          createdAt: session.created_at
        }
      });
    });

    // Record discrepancies
    if (discrepancies.length > 0) {
      const { error: discrepancyError } = await supabase
        .from('gp51_sync_discrepancies')
        .insert(discrepancies);

      if (discrepancyError) {
        console.error('❌ Failed to record discrepancies:', discrepancyError);
      }
    }

    // Calculate consistency score
    const consistencyScore = totalEntitiesChecked > 0 
      ? Math.round(((totalEntitiesChecked - discrepancies.length) / totalEntitiesChecked) * 100)
      : 100;

    const manualReviewRequired = discrepancies.filter(d => 
      d.severity === 'high' || d.severity === 'critical'
    ).length;

    // Complete monitoring record
    await supabase
      .from('data_consistency_monitoring')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_entities_checked: totalEntitiesChecked,
        discrepancies_found: discrepancies.length,
        auto_resolved: autoResolved,
        manual_review_required: manualReviewRequired,
        consistency_score: consistencyScore,
        detailed_results: {
          vehicleDiscrepancies: discrepancies.filter(d => d.entity_type === 'vehicle').length,
          userDiscrepancies: discrepancies.filter(d => d.entity_type === 'user').length,
          duplicateDeviceIds: discrepancies.filter(d => d.discrepancy_type === 'data_mismatch').length
        },
        next_check_scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', monitoring.id);

    // Create alert if consistency score is low
    if (consistencyScore < 85) {
      const severity = consistencyScore < 70 ? 'critical' : 'warning';
      
      await supabase.from('system_alerts').insert({
        alert_type: 'data_inconsistency',
        severity,
        title: 'Data Consistency Issues Detected',
        message: `Consistency score: ${consistencyScore}%. Found ${discrepancies.length} discrepancies requiring ${manualReviewRequired} manual reviews.`,
        source_system: 'data_consistency',
        source_entity_id: monitoring.id,
        alert_data: {
          consistencyScore,
          totalDiscrepancies: discrepancies.length,
          manualReviewRequired,
          totalEntitiesChecked
        }
      });
    }

    console.log(`✅ [DATA-CONSISTENCY] Completed: ${consistencyScore}% consistency, ${discrepancies.length} discrepancies found`);

    return new Response(JSON.stringify({
      success: true,
      monitoringId: monitoring.id,
      consistencyScore,
      totalEntitiesChecked,
      discrepanciesFound: discrepancies.length,
      manualReviewRequired,
      autoResolved
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [DATA-CONSISTENCY] Check failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Consistency check failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
