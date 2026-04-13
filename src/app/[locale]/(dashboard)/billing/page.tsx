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
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Download,
  Check,
  Zap,
  Crown,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingRecord {
  id: string;
  date: Date;
  description: string;
  amount: string;
  status: "paid" | "pending";
}

interface Plan {
  name: string;
  price: string;
  period: string;
  icon: React.ElementType;
  features: string[];
  highlighted?: boolean;
}

const CURRENT_PLAN = "pro";

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    features: [
      "3 social accounts",
      "30 posts/month",
      "Basic analytics",
      "1 team member",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    icon: Crown,
    highlighted: true,
    features: [
      "10 social accounts",
      "Unlimited posts",
      "Advanced analytics",
      "5 team members",
      "AI content assistant",
      "Post approvals",
    ],
  },
  {
    name: "Business",
    price: "$79",
    period: "/month",
    icon: Building2,
    features: [
      "Unlimited social accounts",
      "Unlimited posts",
      "Custom analytics",
      "Unlimited team members",
      "AI content assistant",
      "Post approvals",
      "Priority support",
      "Custom branding",
    ],
  },
];

const now = new Date();

const MOCK_BILLING_HISTORY: BillingRecord[] = [
  {
    id: "inv-001",
    date: new Date(now.getFullYear(), now.getMonth(), 1),
    description: "Pro Plan - Monthly",
    amount: "$29.00",
    status: "paid",
  },
  {
    id: "inv-002",
    date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    description: "Pro Plan - Monthly",
    amount: "$29.00",
    status: "paid",
  },
  {
    id: "inv-003",
    date: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    description: "Pro Plan - Monthly",
    amount: "$29.00",
    status: "paid",
  },
  {
    id: "inv-004",
    date: new Date(now.getFullYear(), now.getMonth() - 3, 1),
    description: "Plan Upgrade: Free to Pro",
    amount: "$29.00",
    status: "paid",
  },
];

export default function BillingPage() {
  const t = useTranslations();

  const handleUpgrade = (planName: string) => {
    toast.info(`Upgrade to ${planName} coming soon`);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.info("Invoice download coming soon");
  };

  const handleUpdatePayment = () => {
    toast.info("Payment method update coming soon");
  };

  const renewalDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan, billing, and payment method
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-4 text-amber-500" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Pro Plan</h3>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                $29.00/month - Renews on{" "}
                {format(renewalDate, "MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between gap-8">
                <span className="text-muted-foreground">Social accounts</span>
                <span className="font-medium">4 / 10</span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-muted-foreground">Posts this month</span>
                <span className="font-medium">47 / Unlimited</span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-muted-foreground">Team members</span>
                <span className="font-medium">4 / 5</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent =
              plan.name.toLowerCase() === CURRENT_PLAN;
            return (
              <Card
                key={plan.name}
                className={cn(
                  plan.highlighted &&
                    "ring-2 ring-primary"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {plan.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="size-3.5 text-green-600 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Badge className="w-full justify-center py-1.5">
                      Current Plan
                    </Badge>
                  ) : (
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleUpgrade(plan.name)}
                    >
                      {plan.price === "$0"
                        ? "Downgrade"
                        : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Visa ending in 4242
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires 12/2027
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleUpdatePayment}>
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_80px_80px] gap-4 items-center px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Date</span>
            <span>Description</span>
            <span>Amount</span>
            <span>Status</span>
            <span className="text-end">Invoice</span>
          </div>

          <div className="divide-y">
            {MOCK_BILLING_HISTORY.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_80px_80px] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm">
                  {format(record.date, "MMM d, yyyy")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {record.description}
                </span>
                <span className="text-sm font-medium">{record.amount}</span>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium",
                      record.status === "paid"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    )}
                  >
                    {record.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDownloadInvoice(record.id)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
