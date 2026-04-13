"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, MoreHorizontal, Shield, Trash2 } from "lucide-react";

type Role = "owner" | "admin" | "editor" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  joinedAt: Date;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  owner: {
    label: "Owner",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  admin: {
    label: "Admin",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  editor: {
    label: "Editor",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  viewer: {
    label: "Viewer",
    color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
};

const now = new Date();

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Ahmad Hassan",
    email: "ahmad@socialpost.app",
    role: "owner",
    joinedAt: new Date(2025, 5, 1),
  },
  {
    id: "2",
    name: "Sarah Miller",
    email: "sarah@socialpost.app",
    role: "admin",
    joinedAt: new Date(2025, 8, 15),
  },
  {
    id: "3",
    name: "James Wilson",
    email: "james@socialpost.app",
    role: "editor",
    joinedAt: new Date(2026, 0, 10),
  },
  {
    id: "4",
    name: "Lina Farouk",
    email: "lina@socialpost.app",
    role: "viewer",
    joinedAt: new Date(2026, 2, 5),
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeamPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("editor");

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("editor");
    setInviteOpen(false);
  };

  const handleChangeRole = (memberId: string, newRole: Role) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    toast.success("Role updated");
  };

  const handleRemove = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success("Member removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team and their permissions
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger
            render={
              <Button>
                <UserPlus className="size-4" />
                Invite Member
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => v && setInviteRole(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleInvite}>Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Post Team</CardTitle>
          <CardDescription>Pro Plan - {members.length} members</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_120px_100px] gap-4 items-center px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Member</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span className="text-end">Actions</span>
          </div>

          <div className="divide-y">
            {members.map((member) => {
              const roleConfig = ROLE_CONFIG[member.role];
              return (
                <div
                  key={member.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_120px_100px] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Member info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(member.name)}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {member.name}
                    </span>
                  </div>

                  {/* Email */}
                  <span className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </span>

                  {/* Role */}
                  <div>
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${roleConfig.color}`}
                    >
                      {roleConfig.label}
                    </span>
                  </div>

                  {/* Joined */}
                  <span className="text-xs text-muted-foreground">
                    {format(member.joinedAt, "MMM d, yyyy")}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {member.role !== "owner" && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(v) =>
                            v && handleChangeRole(member.id, v as Role)
                          }
                        >
                          <SelectTrigger className="h-7 w-auto text-xs">
                            <Shield className="size-3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemove(member.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
