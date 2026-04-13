"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";
import { Plus, RefreshCw, Unlink } from "lucide-react";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";

interface ConnectedAccount {
  id: string;
  platform: Platform;
  name: string;
  username: string;
  status: "active" | "expired";
  lastSynced: Date;
}

const PLATFORM_CONFIG: Record<
  Platform,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  facebook: {
    icon: FacebookIcon,
    label: "Facebook",
    color: "text-blue-600",
    bgColor: "bg-blue-600 hover:bg-blue-700",
  },
  instagram: {
    icon: InstagramIcon,
    label: "Instagram",
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
  },
  twitter: {
    icon: TwitterIcon,
    label: "X / Twitter",
    color: "text-neutral-900 dark:text-neutral-100",
    bgColor: "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900",
  },
  linkedin: {
    icon: LinkedinIcon,
    label: "LinkedIn",
    color: "text-blue-700",
    bgColor: "bg-blue-700 hover:bg-blue-800",
  },
};

const now = new Date();

const MOCK_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "1",
    platform: "facebook",
    name: "Social Post Official",
    username: "@socialpost",
    status: "active",
    lastSynced: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 30),
  },
  {
    id: "2",
    platform: "instagram",
    name: "Social Post",
    username: "@socialpost.app",
    status: "active",
    lastSynced: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 30),
  },
  {
    id: "3",
    platform: "linkedin",
    name: "Social Post Inc.",
    username: "social-post-inc",
    status: "expired",
    lastSynced: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14, 9, 0),
  },
];

export default function AccountsPage() {
  const t = useTranslations();
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [connectOpen, setConnectOpen] = useState(false);

  const handleConnect = (platform: Platform) => {
    toast.info("Coming soon - API keys required");
    setConnectOpen(false);
  };

  const handleReconnect = (accountId: string) => {
    toast.info("Coming soon - API keys required");
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    toast.success("Account disconnected");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Connected Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your linked social media accounts
          </p>
        </div>

        <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="size-4" />
                Connect Account
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect a Platform</DialogTitle>
              <DialogDescription>
                Choose a social media platform to connect to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]).map(
                ([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleConnect(key)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors ${config.bgColor}`}
                    >
                      <Icon className="size-5" />
                      {config.label}
                    </button>
                  );
                }
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Unlink className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No accounts connected yet. Connect your first social media account
              to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const config = PLATFORM_CONFIG[account.platform];
            const Icon = config.icon;

            return (
              <Card key={account.id}>
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted ${config.color}`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{account.name}</p>
                      <Badge
                        variant={
                          account.status === "active" ? "default" : "destructive"
                        }
                        className={
                          account.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : ""
                        }
                      >
                        {account.status === "active" ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {account.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last synced: {format(account.lastSynced, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReconnect(account.id)}
                    >
                      <RefreshCw className="size-3.5" />
                      Reconnect
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      <Unlink className="size-3.5" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
