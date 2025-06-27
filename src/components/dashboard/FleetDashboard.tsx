
import React, { useState, useEffect } from 'react';
import type { GP51Position } from '@/types/gp51-unified';
import { GP51PropertyMapper } from '@/types/gp51-unified';

export const FleetDashboard: React.FC = () => {
  const [positions, setPositions] = useState<GP51Position[]>([]);

  useEffect(() => {
    // Mock data with enhanced positions
    const mockPositions: GP51Position[] = [
      {
        deviceid: 'device_001',
        devicetime: Date.now(),
        arrivedtime: Date.now(),
        updatetime: Date.now(),
        validpoistiontime: Date.now(),
        callat: 40.7128,
        callon: -74.0060,
        altitude: 10,
        radius: 5,
        speed: 25,
        course: 90,
        totaldistance: 50000,
        status: 1,
        strstatus: 'Moving',
        strstatusen: 'Moving',
        alarm: 0,
        stralarm: '',
        stralarmsen: '',
        gotsrc: 'gps',
        rxlevel: 80,
        gpsvalidnum: 8,
        exvoltage: 12.6,
        voltagev: 12.6,
        voltagepercent: 85,
        moving: 1,
        parklat: 0,
        parklon: 0,
        parktime: 0,
        parkduration: 0,
        temp1: 250,
        temp2: 300,
        temp3: 0,
        temp4: 0,
        iostatus: 0,
        currentoverspeedstate: 0,
        rotatestatus: 0,
        loadstatus: 0,
        weight: 0,
        reportmode: 0
      }
    ];
    
    setPositions(mockPositions);
  }, []);

  const enhancedPositions = positions.map(pos => GP51PropertyMapper.enhancePosition(pos));
  const onlineVehicles = enhancedPositions.filter(pos => pos.isOnline).length;
  const offlineVehicles = enhancedPositions.length - onlineVehicles;

  return (
    <div className="fleet-dashboard">
      <h1>Fleet Dashboard</h1>
      
      <div className="summary-cards">
        <div className="card">
          <h3>Online Vehicles</h3>
          <p>{onlineVehicles}</p>
        </div>
        <div className="card">
          <h3>Offline Vehicles</h3>
          <p>{offlineVehicles}</p>
        </div>
      </div>

      <div className="vehicle-list">
        {enhancedPositions.map((position) => (
          <div key={position.deviceid} className="vehicle-item">
            <h4>Vehicle {position.deviceid}</h4>
            <p>Status: {position.isOnline ? 'Online' : 'Offline'}</p>
            <p>Moving: {position.isMoving ? 'Yes' : 'No'}</p>
            <p>Last Update: {position.timestamp.toLocaleString()}</p>
            <p>Location: {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FleetDashboard;
