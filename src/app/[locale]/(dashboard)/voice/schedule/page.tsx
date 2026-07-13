"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Save, X } from "lucide-react";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const PLATFORMS = ["linkedin", "twitter", "facebook", "instagram"] as const;
const TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Africa/Cairo",
  "UTC",
  "Europe/London",
  "America/New_York",
];

interface Schedule {
  id: string;
  days: string;
  times: string;
  platforms: string;
  timezone: string;
  isActive: boolean;
}

function parseArr(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

export default function SchedulePage() {
  const t = useTranslations("voice.schedule");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<Set<string>>(new Set());
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("10:00");
  const [platforms, setPlatforms] = useState<Set<string>>(new Set());
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetch("/api/voice/schedule", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s: Schedule | null = d.schedule;
        if (s) {
          setDays(new Set(parseArr(s.days)));
          setTimes(parseArr(s.times).sort());
          setPlatforms(new Set(parseArr(s.platforms)));
          setTimezone(s.timezone || "Asia/Riyadh");
          setIsActive(s.isActive);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (set: Set<string>, key: string, setter: (v: Set<string>) => void) => {
    const s = new Set(set);
    if (s.has(key)) s.delete(key);
    else s.add(key);
    setter(s);
  };

  const addTime = () => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      toast.error("Time must be HH:mm");
      return;
    }
    if (times.includes(newTime)) return;
    setTimes([...times, newTime].sort());
  };

  const removeTime = (t: string) => {
    setTimes(times.filter((x) => x !== t));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/voice/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: Array.from(days),
          times,
          platforms: Array.from(platforms),
          timezone,
          isActive,
        }),
      });
      if (!r.ok) throw new Error("Failed");
      toast.success(t("saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4"
          />
          {t("activeLabel")}
        </label>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-5">
          <div>
            <Label>{t("daysLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const isSel = days.has(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggle(days, d, setDays)}
                    className={
                      "text-sm px-3 py-1.5 rounded-md border min-w-[52px] transition-colors " +
                      (isSel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/30 hover:border-muted-foreground/60")
                    }
                  >
                    {t(`day.${d}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>{t("timesLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {times.map((tm) => (
                <span
                  key={tm}
                  className="inline-flex items-center gap-1 text-sm bg-muted rounded-md px-2.5 py-1"
                >
                  {tm}
                  <button
                    onClick={() => removeTime(tm)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-[130px]"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTime}>
                <Plus className="size-4" />
                {t("addTime")}
              </Button>
            </div>
          </div>

          <div>
            <Label>{t("platformsLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const isSel = platforms.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(platforms, p, setPlatforms)}
                    className={
                      "text-sm px-3 py-1.5 rounded-md border capitalize transition-colors " +
                      (isSel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/30 hover:border-muted-foreground/60")
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-xs">
            <Label>{t("timezoneLabel")}</Label>
            <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
