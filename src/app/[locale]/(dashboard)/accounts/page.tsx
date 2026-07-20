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
  BlueskyIcon,
} from "@/components/icons/social-icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, RefreshCw, Unlink, Loader2 } from "lucide-react";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin" | "bluesky";

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
  bluesky: {
    icon: BlueskyIcon,
    label: "Bluesky",
    color: "text-sky-500",
    bgColor: "bg-sky-500 hover:bg-sky-600",
    available: true,
  },
  facebook: {
    icon: FacebookIcon,
    label: "Facebook",
    color: "text-blue-600",
    bgColor: "bg-blue-600 hover:bg-blue-700",
    available: true,
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
    available: true,
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
  const [bskyOpen, setBskyOpen] = useState(false);
  const [bskyHandle, setBskyHandle] = useState("");
  const [bskyPassword, setBskyPassword] = useState("");
  const [bskySubmitting, setBskySubmitting] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [fbToken, setFbToken] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);

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
    if (platform === "bluesky") {
      setConnectOpen(false);
      setBskyOpen(true);
      return;
    }
    if (platform === "facebook") {
      setConnectOpen(false);
      setFbOpen(true);
      return;
    }
    setConnectOpen(false);
    window.location.href = `/api/accounts/connect/${platform}`;
  };

  const submitFacebook = async () => {
    if (!fbToken.trim()) return;
    setFbSubmitting(true);
    try {
      const r = await fetch("/api/accounts/connect/facebook-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageToken: fbToken.trim() }),
      });
      const d = await safeJson<{
        error?: string;
        saved?: Array<{ name: string }>;
        account?: { name: string };
        note?: string;
      }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));
      const savedList: Array<{ name: string }> = Array.isArray(d.saved)
        ? d.saved
        : d.account
          ? [d.account]
          : [];
      const label =
        savedList.length === 1
          ? savedList[0].name
          : `${savedList.length} pages`;
      toast.success(`Connected: ${label}`);
      if (d.note) toast.info(d.note);
      setFbOpen(false);
      setFbToken("");
      fetchAccounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFbSubmitting(false);
    }
  };

  const submitBluesky = async () => {
    if (!bskyHandle.trim() || !bskyPassword.trim()) return;
    setBskySubmitting(true);
    try {
      const r = await fetch("/api/accounts/connect/bluesky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: bskyHandle.trim(),
          appPassword: bskyPassword.trim(),
        }),
      });
      const d = await safeJson<{ error?: string }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));
      toast.success("Bluesky connected");
      setBskyOpen(false);
      setBskyHandle("");
      setBskyPassword("");
      fetchAccounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBskySubmitting(false);
    }
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

        <Dialog open={fbOpen} onOpenChange={setFbOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Facebook Pages</DialogTitle>
              <DialogDescription>
                Paste a Facebook <strong>User Access Token</strong> — we&apos;ll
                exchange it for a long-lived one and import every page you
                admin at once. Or paste a single Page Access Token to add
                just that page.
                <br />
                <br />
                Get one from{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Graph API Explorer
                </a>
                : select your app → request{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  pages_manage_posts, pages_show_list
                </code>{" "}
                → click <em>Generate Access Token</em> → copy the token at
                the top and paste it here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>Page Access Token</Label>
                <Textarea
                  placeholder="EAAG..."
                  value={fbToken}
                  onChange={(e) => setFbToken(e.target.value)}
                  className="font-mono text-xs min-h-[100px]"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We verify the token by fetching the page identity and store
                  it encrypted. Page ID and name are detected automatically.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setFbOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitFacebook}
                  disabled={fbSubmitting || !fbToken.trim()}
                >
                  {fbSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Connect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={bskyOpen} onOpenChange={setBskyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Bluesky</DialogTitle>
              <DialogDescription>
                Bluesky uses an app password instead of OAuth. Create one at{" "}
                <a
                  href="https://bsky.app/settings/app-passwords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  bsky.app → Settings → App Passwords
                </a>{" "}
                and paste it below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>Handle</Label>
                <Input
                  placeholder="yourname.bsky.social"
                  value={bskyHandle}
                  onChange={(e) => setBskyHandle(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label>App password</Label>
                <Input
                  type="password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={bskyPassword}
                  onChange={(e) => setBskyPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBskyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitBluesky}
                  disabled={
                    bskySubmitting || !bskyHandle.trim() || !bskyPassword.trim()
                  }
                >
                  {bskySubmitting && <Loader2 className="size-4 animate-spin" />}
                  Connect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
