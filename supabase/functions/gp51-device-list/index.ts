
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { fetchFromGP51, FetchGP51Response } from "../_shared/gp51_api_client.ts";
import { handleCorsOptionsRequest } from "../_shared/cors.ts";

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  sessionValidationTime: number;
  gp51RequestTime: number;
  dataProcessingTime: number;
}

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  const metrics: PerformanceMetrics = {
    startTime: Date.now(),
    endTime: 0,
    sessionValidationTime: 0,
    gp51RequestTime: 0,
    dataProcessingTime: 0
  };

  try {
    console.log("🚀 [gp51-device-list] Enhanced device list fetch initiated");
    
    // Session validation with timing
    const sessionStart = Date.now();
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    metrics.sessionValidationTime = Date.now() - sessionStart;
    
    if (sessionError) {
      console.error("❌ [gp51-device-list] Session validation failed");
      console.log(`📊 [METRICS] Session validation: ${metrics.sessionValidationTime}ms`);
      return sessionError;
    }

    console.log(`✅ [gp51-device-list] Session validated in ${metrics.sessionValidationTime}ms`);
    console.log("🔄 [gp51-device-list] Fetching device list from GP51 with validated querymonitorlist action...");

    // GP51 API call with timing
    const gp51Start = Date.now();
    const gp51Result: FetchGP51Response = await fetchFromGP51({
      action: "querymonitorlist",
      session: session!,
      additionalParams: {
        username: session!.username,
      },
    });
    metrics.gp51RequestTime = Date.now() - gp51Start;

    console.log(`📊 [METRICS] GP51 API call: ${metrics.gp51RequestTime}ms`);

    if (gp51Result.error) {
      console.error("❌ [gp51-device-list] Failed to fetch device list from GP51.", gp51Result);
      console.log(`📊 [METRICS] Total request time: ${Date.now() - metrics.startTime}ms`);
      
      return errorResponse(
        `GP51 API error: ${gp51Result.error}`,
        gp51Result.status || 400,
        {
          ...gp51Result.gp51_error,
          triedAction: "querymonitorlist",
          metrics: {
            sessionValidation: metrics.sessionValidationTime,
            gp51Request: metrics.gp51RequestTime
          }
        }
      );
    }
    
    console.log(`✅ [gp51-device-list] Successfully fetched data with querymonitorlist action`);

    // Data processing with timing
    const processingStart = Date.now();
    const resultData = gp51Result.data;
    
    // Enhanced validation and logging
    if (!resultData) {
      console.error("❌ [gp51-device-list] No data returned from GP51 API");
      return errorResponse("No data returned from GP51 API", 502);
    }

    // Validate response structure according to API documentation
    if (typeof resultData.status !== 'number') {
      console.error("❌ [gp51-device-list] Invalid response format: missing status field");
      return errorResponse("Invalid GP51 API response format", 502, { response: resultData });
    }

    if (resultData.status !== 0) {
      const errorMsg = resultData.cause || `GP51 API returned error status: ${resultData.status}`;
      console.error(`❌ [gp51-device-list] GP51 API error: ${errorMsg}`);
      return errorResponse(errorMsg, 400, { gp51Status: resultData.status, gp51Cause: resultData.cause });
    }

    // Process groups and devices according to API documentation
    const groups = resultData.groups || [];
    const devices = groups.flatMap((g: any) => {
      const groupDevices = g.devices || [];
      // Add group context to each device for better tracking
      return groupDevices.map((device: any) => ({
        ...device,
        groupId: g.groupid,
        groupName: g.groupname,
        groupRemark: g.remark
      }));
    });

    metrics.dataProcessingTime = Date.now() - processingStart;
    metrics.endTime = Date.now();

    const totalTime = metrics.endTime - metrics.startTime;
    
    console.log(`📊 [gp51-device-list] Successfully processed ${devices.length} devices from ${groups.length} groups.`);
    console.log(`📊 [PERFORMANCE BREAKDOWN]:`);
    console.log(`  - Session validation: ${metrics.sessionValidationTime}ms`);
    console.log(`  - GP51 API request: ${metrics.gp51RequestTime}ms`);
    console.log(`  - Data processing: ${metrics.dataProcessingTime}ms`);
    console.log(`  - Total time: ${totalTime}ms`);

    // Enhanced response with additional metadata
    return jsonResponse({ 
      success: true, 
      devices,
      metadata: {
        deviceCount: devices.length,
        groupCount: groups.length,
        responseTime: totalTime,
        apiVersion: "querymonitorlist",
        fetchedAt: new Date().toISOString()
      },
      rawData: resultData, // Include raw data for validation purposes
      performance: {
        sessionValidation: metrics.sessionValidationTime,
        gp51Request: metrics.gp51RequestTime,
        dataProcessing: metrics.dataProcessingTime,
        total: totalTime
      }
    });

  } catch (error) {
    metrics.endTime = Date.now();
    const totalTime = metrics.endTime - metrics.startTime;
    
    console.error("❌ [gp51-device-list] Critical error in function:", error);
    console.log(`📊 [ERROR METRICS] Failed after ${totalTime}ms`);
    
    return errorResponse(
      `Internal server error: ${error.message}`,
      500,
      {
        stack: error.stack,
        metrics: {
          sessionValidation: metrics.sessionValidationTime,
          gp51Request: metrics.gp51RequestTime,
          total: totalTime
        }
      }
    );
  }
});
