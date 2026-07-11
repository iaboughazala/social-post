"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Card,
  CardContent,
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
import { Plus, RefreshCw, Unlink, Loader2 } from "lucide-react";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";

interface ApiAccount {
  id: string;
  platform: Platform;
  platformId: string;
  name: string;
  username: string | null;
  avatar: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const PLATFORM_CONFIG: Record<
  Platform,
  { icon: React.ElementType; label: string; color: string; bgColor: string; available: boolean }
> = {
  linkedin: {
    icon: LinkedinIcon,
    label: "LinkedIn",
    color: "text-blue-700",
    bgColor: "bg-blue-700 hover:bg-blue-800",
    available: true,
  },
  facebook: {
    icon: FacebookIcon,
    label: "Facebook",
    color: "text-blue-600",
    bgColor: "bg-blue-600 hover:bg-blue-700",
    available: false,
  },
  instagram: {
    icon: InstagramIcon,
    label: "Instagram",
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
    available: false,
  },
  twitter: {
    icon: TwitterIcon,
    label: "X / Twitter",
    color: "text-neutral-900 dark:text-neutral-100",
    bgColor: "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900",
    available: false,
  },
};

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export default function AccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      const label = PLATFORM_CONFIG[connected as Platform]?.label || connected;
      toast.success(`${label} connected successfully`);
      router.replace("/en/accounts");
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      router.replace("/en/accounts");
    }
  }, [searchParams, router]);

  const handleConnect = (platform: Platform) => {
    const config = PLATFORM_CONFIG[platform];
    if (!config.available) {
      toast.info(`${config.label} integration is not available yet`);
      return;
    }
    setConnectOpen(false);
    window.location.href = `/api/accounts/connect/${platform}`;
  };

  const handleReconnect = (platform: Platform) => {
    handleConnect(platform);
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    try {
      const res = await fetch(`/api/accounts?id=${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast.success("Account disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    }
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
                      disabled={!config.available}
                      className={`relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors ${config.bgColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Icon className="size-5" />
                      {config.label}
                      {!config.available && (
                        <span className="absolute top-1 right-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
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
            if (!config) return null;
            const Icon = config.icon;
            const expired = isExpired(account.expiresAt);
            const status: "active" | "expired" = expired ? "expired" : "active";

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
                        variant={status === "active" ? "default" : "destructive"}
                        className={
                          status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : ""
                        }
                      >
                        {status === "active" ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    {account.username && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {account.username}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Connected: {format(new Date(account.createdAt), "MMM d, yyyy")}
                      {account.expiresAt && (
                        <>
                          {" • "}
                          {expired ? "Expired" : "Expires"}:{" "}
                          {format(new Date(account.expiresAt), "MMM d, yyyy")}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReconnect(account.platform)}
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
