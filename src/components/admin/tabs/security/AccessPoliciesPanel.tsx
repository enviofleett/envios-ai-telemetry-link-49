
import React from "react";
import { useSecurityContext } from "@/components/security/SecurityProvider";

interface AccessPoliciesPanelProps {
  refreshToken?: number;
}

const AccessPoliciesPanel: React.FC<AccessPoliciesPanelProps> = ({ refreshToken }) => {
  const { hasPermission } = useSecurityContext();

  // Example view: could list out roles and permissions
  const roles = ["admin", "manager", "user", "viewer"];
  const permissions = [
    "create_user",
    "delete_user",
    "manage_vehicles",
    "view_all",
    "manage_system",
    "access_audit_logs",
    "manage_security_config",
    "view_audit_logs",
    "manage_own_vehicles",
    "update_own_profile",
    "view_own"
  ];

  return (
    <div className="p-4">
      <div className="font-semibold text-lg mb-4">Access Policies</div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted border-b">
              <th className="p-2 text-left">Role</th>
              {permissions.map((perm) => (
                <th key={perm} className="p-2 text-center whitespace-nowrap">
                  {perm}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role} className="border-b">
                <td className="p-2 font-semibold capitalize">{role}</td>
                {permissions.map((perm) => (
                  <td key={perm} className="p-2 text-center">
                    {hasPermission(role, perm) ? (
                      <span className="inline-block bg-green-200 text-green-900 rounded px-2 py-0.5 text-xs">✔</span>
                    ) : (
                      <span className="inline-block bg-red-100 text-red-500 rounded px-2 py-0.5 text-xs">✖</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-muted-foreground text-sm mt-4">
        Contact technical admin to modify role-based access policies.
      </div>
    </div>
  );
};

export default AccessPoliciesPanel;
