
import React, { useState, useEffect } from "react";
import { PlatformAdminService, PlatformAdminUser } from "@/services/admin/PlatformAdminService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  system_admin: "System Admin",
  support_admin: "Support Admin",
};

export default function PlatformAdminUsersPanel() {
  const [admins, setAdmins] = useState<PlatformAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteRole, setInviteRole] = useState<"super_admin" | "system_admin" | "support_admin">("support_admin");
  const [inviteUserId, setInviteUserId] = useState("");

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const list = await PlatformAdminService.listAdmins();
      setAdmins(list);
    } catch (e) {
      // TODO: Provide toast for error
      console.error("Failed to fetch platform admins", e);
    }
    setLoading(false);
  };

  // Demo only: You would use an invite flow to get user id for a new admin in real implementations
  const handleAddAdmin = async () => {
    if (!inviteEmail || !inviteUserId || !inviteDisplayName) return;
    try {
      await PlatformAdminService.addAdmin(inviteEmail, inviteUserId, inviteDisplayName, inviteRole);
      setInviteEmail("");
      setInviteUserId("");
      setInviteDisplayName("");
      setInviteRole("support_admin");
      setInviteDialogOpen(false);
      fetchAdminUsers();
    } catch (e) {
      // TODO: Provide toast for error
      alert((e as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Platform Admin Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Button onClick={() => setInviteDialogOpen(!inviteDialogOpen)}>Invite New Admin</Button>
        </div>

        {inviteDialogOpen && (
          <div className="mb-6 p-4 border rounded space-y-2 bg-muted/40">
            <div className="flex gap-2">
              <Input
                placeholder="Admin Email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-48"
              />
              <Input
                placeholder="User ID"
                value={inviteUserId}
                onChange={e => setInviteUserId(e.target.value)}
                className="w-48"
              />
              <Input
                placeholder="Display Name"
                value={inviteDisplayName}
                onChange={e => setInviteDisplayName(e.target.value)}
                className="w-48"
              />
              <select
                className="border rounded p-2"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as any)}
              >
                <option value="support_admin">Support Admin</option>
                <option value="system_admin">System Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <Button onClick={handleAddAdmin}>Add</Button>
            </div>
            <div className="text-xs text-muted-foreground">
              * Demo: You must input valid auth.users UUID for user_id here! (Invite flow not implemented)
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full border bg-white rounded text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Display Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Roles</th>
                <th className="p-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td className="p-2">{admin.display_name || "-"}</td>
                  <td className="p-2">{admin.email}</td>
                  <td className="p-2">
                    {admin.roles?.map(r => (
                      <Badge key={r} className="mr-1">{ROLE_LABELS[r] || r}</Badge>
                    ))}
                  </td>
                  <td className="p-2">{admin.created_at && new Date(admin.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
