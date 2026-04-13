"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface Approval {
  id: string;
  content: string;
  author: string;
  platforms: Platform[];
  status: ApprovalStatus;
  requestedAt: Date;
  reviewer?: string;
  reviewComment?: string;
  reviewedAt?: Date;
}

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  twitter: "text-neutral-900 dark:text-neutral-100",
  linkedin: "text-blue-700",
};

const now = new Date();

const INITIAL_APPROVALS: Approval[] = [
  {
    id: "1",
    content:
      "Exciting news! We're launching our new AI-powered content assistant next week. Stay tuned for early access details.",
    author: "James Wilson",
    platforms: ["facebook", "instagram", "twitter"],
    status: "pending",
    requestedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0),
  },
  {
    id: "2",
    content:
      "Join our upcoming webinar on social media strategy for Q2 2026. Limited spots available!",
    author: "Lina Farouk",
    platforms: ["linkedin", "facebook"],
    status: "pending",
    requestedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30),
  },
  {
    id: "3",
    content:
      "Customer story: How TechCorp grew their engagement by 250% using Social Post in just 3 months.",
    author: "Sarah Miller",
    platforms: ["linkedin", "twitter"],
    status: "approved",
    requestedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 14, 0),
    reviewer: "Ahmad Hassan",
    reviewComment: "Great case study - approved for publishing.",
    reviewedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0),
  },
  {
    id: "4",
    content:
      "FLASH SALE!!! 80% OFF EVERYTHING!!! BUY NOW OR MISS OUT FOREVER!!!",
    author: "James Wilson",
    platforms: ["facebook", "instagram"],
    status: "rejected",
    requestedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 16, 0),
    reviewer: "Ahmad Hassan",
    reviewComment:
      "The tone is too aggressive and does not match our brand voice. Please revise with a more professional tone.",
    reviewedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 9, 0),
  },
];

export default function ApprovalsPage() {
  const t = useTranslations();
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [comments, setComments] = useState<Record<string, string>>({});

  const pendingItems = approvals.filter((a) => a.status === "pending");
  const approvedItems = approvals.filter((a) => a.status === "approved");
  const rejectedItems = approvals.filter((a) => a.status === "rejected");

  const handleApprove = useCallback(
    (id: string) => {
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "approved" as ApprovalStatus,
                reviewer: "You",
                reviewComment: comments[id] || "Approved",
                reviewedAt: new Date(),
              }
            : a
        )
      );
      setComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Post approved");
    },
    [comments]
  );

  const handleReject = useCallback(
    (id: string) => {
      if (!comments[id]?.trim()) {
        toast.error("Please add a comment when rejecting");
        return;
      }
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "rejected" as ApprovalStatus,
                reviewer: "You",
                reviewComment: comments[id],
                reviewedAt: new Date(),
              }
            : a
        )
      );
      setComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Post rejected");
    },
    [comments]
  );

  const renderApprovalCard = (approval: Approval) => (
    <Card key={approval.id}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm leading-relaxed flex-1">{approval.content}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {approval.author}
          </span>
          <span>-</span>
          <div className="flex items-center gap-1.5">
            {approval.platforms.map((platform) => {
              const Icon = PLATFORM_ICONS[platform];
              return (
                <Icon
                  key={platform}
                  className={cn("size-3.5", PLATFORM_COLORS[platform])}
                />
              );
            })}
          </div>
          <span>-</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {format(approval.requestedAt, "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>

        {/* Review info for approved/rejected */}
        {approval.status !== "pending" && approval.reviewer && (
          <div
            className={cn(
              "rounded-lg p-3 text-sm",
              approval.status === "approved"
                ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30"
                : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {approval.status === "approved" ? (
                <CheckCircle2 className="size-4 text-green-600" />
              ) : (
                <XCircle className="size-4 text-red-600" />
              )}
              <span className="font-medium text-xs">
                {approval.status === "approved" ? "Approved" : "Rejected"} by{" "}
                {approval.reviewer}
              </span>
              {approval.reviewedAt && (
                <span className="text-xs text-muted-foreground ms-auto">
                  {format(approval.reviewedAt, "MMM d, yyyy")}
                </span>
              )}
            </div>
            {approval.reviewComment && (
              <p className="text-xs text-muted-foreground">
                {approval.reviewComment}
              </p>
            )}
          </div>
        )}

        {/* Actions for pending */}
        {approval.status === "pending" && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2">
              <MessageSquare className="size-4 text-muted-foreground mt-1 shrink-0" />
              <Textarea
                placeholder="Add a comment (required for rejection)..."
                value={comments[approval.id] || ""}
                onChange={(e) =>
                  setComments((prev) => ({
                    ...prev,
                    [approval.id]: e.target.value,
                  }))
                }
                className="min-h-[60px]"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReject(approval.id)}
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApprove(approval.id)}
              >
                <CheckCircle2 className="size-3.5" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Post Approvals</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve posts before they go live
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedItems.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No pending approvals. All caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingItems.map(renderApprovalCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approvedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No approved posts yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedItems.map(renderApprovalCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No rejected posts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedItems.map(renderApprovalCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
