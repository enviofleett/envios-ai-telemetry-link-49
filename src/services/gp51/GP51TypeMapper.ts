
import type { GP51Device, GP51Position, GP51Group } from '@/types/gp51-unified';

export class GP51TypeMapper {
  static mapApiDeviceToUnified(apiDevice: any): GP51Device {
    return {
      deviceid: apiDevice.deviceid || apiDevice.device_id || '',
      devicename: apiDevice.devicename || apiDevice.device_name || '',
      devicetype: String(apiDevice.devicetype || apiDevice.device_type || '0'),
      groupid: apiDevice.groupid || apiDevice.group_id || '',
      groupname: apiDevice.groupname || apiDevice.group_name || '',
      imei: apiDevice.imei || '',
      simcardno: apiDevice.simcardno || apiDevice.sim_card_no || '',
      status: apiDevice.status || 0,
      createtime: apiDevice.createtime || apiDevice.create_time || new Date().toISOString(),
      lastactivetime: apiDevice.lastactivetime || apiDevice.last_active_time || new Date().toISOString(),
      isOnline: apiDevice.isOnline || apiDevice.is_online || false,
      vehicleInfo: apiDevice.vehicleInfo || apiDevice.vehicle_info || null,
      isActive: apiDevice.isActive || apiDevice.is_active || false,
      // Additional properties for compatibility
      simnum: apiDevice.simnum || apiDevice.sim_card_no || '',
      overduetime: apiDevice.overduetime || 0,
      expirenotifytime: apiDevice.expirenotifytime || 0,
      remark: apiDevice.remark || '',
      creater: apiDevice.creater || '',
      videochannelcount: apiDevice.videochannelcount || 0,
      isfree: apiDevice.isfree || 0,
      allowedit: apiDevice.allowedit || 0,
      icon: apiDevice.icon || 0,
      stared: apiDevice.stared || 0,
      loginame: apiDevice.loginame || ''
    };
  }

  static mapApiPositionToUnified(apiPosition: any): GP51Position {
    return {
      deviceid: apiPosition.deviceid || apiPosition.device_id || '',
      callat: apiPosition.callat || apiPosition.latitude || 0,
      callon: apiPosition.callon || apiPosition.longitude || 0,
      speed: apiPosition.speed || 0,
      course: apiPosition.course || apiPosition.direction || 0,
      altitude: apiPosition.altitude || 0,
      devicetime: apiPosition.devicetime || apiPosition.device_time || new Date().toISOString(),
      servertime: apiPosition.servertime || apiPosition.server_time || new Date().toISOString(),
      status: apiPosition.status || 0,
      moving: apiPosition.moving || false,
      gotsrc: apiPosition.gotsrc || apiPosition.gps_source || 0,
      battery: apiPosition.battery || apiPosition.voltagepercent || 0,
      signal: apiPosition.signal || apiPosition.rxlevel || 0,
      satellites: apiPosition.satellites || apiPosition.gpsvalidnum || 0,
      totaldistance: apiPosition.totaldistance || apiPosition.total_distance || 0,
      strstatus: apiPosition.strstatus || apiPosition.str_status || '',
      strstatusen: apiPosition.strstatusen || apiPosition.str_status_en || '',
      alarm: apiPosition.alarm || 0,
      alarmtype: apiPosition.alarmtype || apiPosition.alarm_type || '',
      alarmtypeen: apiPosition.alarmtypeen || apiPosition.alarm_type_en || '',
      address: apiPosition.address || '',
      addressen: apiPosition.addressen || apiPosition.address_en || '',
      geoaddr: apiPosition.geoaddr || apiPosition.geo_addr || '',
      geoaddrfrom: apiPosition.geoaddrfrom || apiPosition.geo_addr_from || '',
      accuracyvalue: apiPosition.accuracyvalue || apiPosition.accuracy_value || 0,
      location: apiPosition.location || null,
      temperature: apiPosition.temperature || null,
      humidity: apiPosition.humidity || null,
      pressure: apiPosition.pressure || null,
      fuel: apiPosition.fuel || null,
      engine: apiPosition.engine || null,
      door: apiPosition.door || null,
      air_condition: apiPosition.air_condition || null,
      custom_data: apiPosition.custom_data || null,
      raw_data: apiPosition.raw_data || null,
      latitude: apiPosition.callat || apiPosition.latitude || 0,
      longitude: apiPosition.callon || apiPosition.longitude || 0,
      updatetime: apiPosition.updatetime || apiPosition.servertime || new Date().toISOString()
    };
  }

  static mapApiGroupToUnified(apiGroup: any): GP51Group {
    return {
      groupid: apiGroup.groupid || apiGroup.group_id || '',
      groupname: apiGroup.groupname || apiGroup.group_name || '',
      parentgroupid: apiGroup.parentgroupid || apiGroup.parent_group_id || '',
      level: apiGroup.level || 0,
      devicecount: apiGroup.devicecount || apiGroup.device_count || 0,
      children: apiGroup.children || [],
      remark: apiGroup.remark || '',
      devices: apiGroup.devices || []
    };
  }
}
