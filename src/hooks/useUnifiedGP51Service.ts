
import { useState, useCallback, useEffect } from 'react';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import type {
  GP51AuthResponse,
  GP51MonitorListResponse,
  GP51HealthStatus,
  GP51Session,
  GP51User,
  GP51Device,
  GP51Group,
  GP51Position,
  GP51DashboardSummary,
  UseUnifiedGP51ServiceReturn
} from '@/types/gp51';

export function useUnifiedGP51Service(): UseUnifiedGP51ServiceReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const [summary, setSummary] = useState<GP51DashboardSummary | null>(null);
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);

  // Sync with service state
  useEffect(() => {
    const syncState = () => {
      setIsAuthenticated(unifiedGP51Service.isAuthenticated);
      setIsConnected(unifiedGP51Service.isConnected);
      setSession(unifiedGP51Service.session);
    };

    syncState();
    const interval = setInterval(syncState, 1000);
    return () => clearInterval(interval);
  }, []);

  const authenticate = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      
      if (result.success || result.status === 0) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ 
          username, 
          usertype: 11, 
          showname: username,
          id: username,
          gp51_username: username,
          is_active: true
        });
        
        await fetchData();
      } else {
        const errorMsg = result.error || result.cause || 'Authentication failed';
        setError(errorMsg);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticateAdmin = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await unifiedGP51Service.authenticateAdmin(username, password);
      
      if (result.success || result.status === 0) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ 
          username, 
          usertype: 3, 
          showname: username,
          id: username,
          gp51_username: username,
          is_active: true
        });
        
        await fetchData();
      } else {
        const errorMsg = result.error || result.cause || 'Admin authentication failed';
        setError(errorMsg);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Admin authentication failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await unifiedGP51Service.logout();
    setIsAuthenticated(false);
    setIsConnected(false);
    setCurrentUser(null);
    setSession(null);
    setUsers([]);
    setDevices([]);
    setGroups([]);
    setSummary(null);
    setHealthStatus(null);
    setError(null);
  }, []);

  const disconnect = useCallback(async () => {
    await unifiedGP51Service.disconnect();
    setIsAuthenticated(false);
    setIsConnected(false);
    setCurrentUser(null);
    setSession(null);
    setError(null);
  }, []);

  const fetchData = useCallback(async () => {
    if (!unifiedGP51Service.isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.queryMonitorList();
      
      if (result.success || result.status === 0) {
        const fetchedGroups = result.groups || [];
        
        // Process groups with component-compatible properties
        setGroups(fetchedGroups.map(group => ({
          ...group,
          id: group.groupid.toString(),
          group_id: group.groupid,
          group_name: group.groupname,
          device_count: group.devices?.length || 0,
          last_sync_at: new Date().toISOString()
        })));

        // Process devices with component-compatible properties
        const allDevices: GP51Device[] = [];
        fetchedGroups.forEach(group => {
          if (group.devices) {
            group.devices.forEach(device => {
              allDevices.push({
                ...device,
                id: device.deviceid,
                device_id: device.deviceid,
                device_name: device.devicename,
                device_type: device.devicetype,
                sim_number: device.simnum,
                last_active_time: device.lastactivetime,
                is_active: device.status === 'active',
                starred: false,
                gps51_groups: group.groupname,
                owner: 'system'
              });
            });
          }
        });
        setDevices(allDevices);

        // Create summary with both property naming conventions
        const newSummary: GP51DashboardSummary = {
          totalUsers: 0,
          totalDevices: allDevices.length,
          activeDevices: allDevices.filter(d => d.is_active).length,
          offlineDevices: allDevices.filter(d => !d.is_active).length,
          totalGroups: fetchedGroups.length,
          lastUpdateTime: new Date(),
          connectionStatus: 'connected',
          apiResponseTime: 0,
          total_users: 0,
          total_devices: allDevices.length,
          active_devices: allDevices.filter(d => d.is_active).length,
          offline_devices: allDevices.filter(d => !d.is_active).length,
          total_groups: fetchedGroups.length
        };
        setSummary(newSummary);

      } else {
        const errorMsg = result.error || result.cause || 'Failed to fetch data';
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsers([]);
  }, []);

  const fetchDevices = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const connectionHealth = useCallback(async () => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      setHealthStatus(health);
      setIsConnected(health.isConnected);
      
      if (!health.isConnected && health.errorMessage) {
        setError(health.errorMessage);
      }
      
      return health;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMsg);
      setIsConnected(false);
      throw err;
    }
  }, []);

  const getPositions = useCallback(async (deviceIds?: string[]) => {
    try {
      const positions = await unifiedGP51Service.getLastPositions(deviceIds);
      
      return positions.map(pos => ({
        ...pos,
        device_id: pos.deviceid,
        latitude: pos.callat || pos.lat || 0,
        longitude: pos.callon || pos.lon || 0,
        update_time: pos.updatetime || pos.timestamp,
        address: ''
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get positions';
      setError(errorMsg);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionLoaded = await unifiedGP51Service.loadExistingSession();
        if (sessionLoaded) {
          setIsAuthenticated(true);
          setIsConnected(true);
          setSession(unifiedGP51Service.session);
          await fetchData();
        }
      } catch (error) {
        console.error('Failed to load existing session:', error);
      }
    };

    loadSession();
  }, [fetchData]);

  return {
    authenticate,
    authenticateAdmin,
    logout,
    disconnect,
    isAuthenticated,
    isConnected,
    currentUser,
    session,
    isLoading,
    error,
    users,
    devices,
    groups,
    summary,
    healthStatus,
    connectionHealth,
    fetchData,
    fetchUsers,
    fetchDevices,
    getPositions,
    clearError
  };
}

export default useUnifiedGP51Service;
