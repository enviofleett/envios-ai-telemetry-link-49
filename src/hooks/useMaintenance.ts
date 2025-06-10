
import { useMaintenanceServicePlans } from './maintenance/useMaintenanceServicePlans';
import { useMaintenanceAppointments } from './maintenance/useMaintenanceAppointments';
import { useMaintenanceRecords } from './maintenance/useMaintenanceRecords';
import { useMaintenanceSchedules } from './maintenance/useMaintenanceSchedules';
import { useMaintenanceNotifications } from './maintenance/useMaintenanceNotifications';
import { useMaintenanceStats } from './maintenance/useMaintenanceStats';

export const useMaintenance = () => {
  const servicePlansHook = useMaintenanceServicePlans();
  const appointmentsHook = useMaintenanceAppointments();
  const recordsHook = useMaintenanceRecords();
  const schedulesHook = useMaintenanceSchedules();
  const notificationsHook = useMaintenanceNotifications();
  const statsHook = useMaintenanceStats();

  return {
    loading: appointmentsHook.loading || servicePlansHook.loading,
    getServicePlans: servicePlansHook.getServicePlans,
    getUserAppointments: appointmentsHook.getUserAppointments,
    createAppointment: appointmentsHook.createAppointment,
    updateAppointmentStatus: appointmentsHook.updateAppointmentStatus,
    getMaintenanceHistory: recordsHook.getMaintenanceHistory,
    getMaintenanceSchedules: schedulesHook.getMaintenanceSchedules,
    getMaintenanceNotifications: notificationsHook.getMaintenanceNotifications,
    getMaintenanceStats: statsHook.getMaintenanceStats
  };
};

export default useMaintenance;
