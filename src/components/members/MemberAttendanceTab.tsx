// src/components/members/MemberAttendanceTab.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  subDays,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
  isAfter,
  startOfMonth,
} from "date-fns";
import { Flame, CalendarDays, Activity, Loader2 } from "lucide-react";

export function MemberAttendanceTab({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(true);
  const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, streak: 0, thisMonth: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      const supabase = createClient();

      // Fetch all attendance logs for this member
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("check_in_at")
        .eq("member_id", memberId)
        .order("check_in_at", { ascending: false });

      if (error) {
        console.error("Error fetching attendance:", error);
        setLoading(false);
        return;
      }

      // Convert to a Set of unique YYYY-MM-DD strings for O(1) lookups
      const datesSet = new Set<string>();
      let monthCount = 0;
      const thisMonthStart = startOfMonth(new Date());

      data?.forEach((log: any) => {
        const dateObj = new Date(log.check_in_at);
        datesSet.add(format(dateObj, "yyyy-MM-dd"));

        if (
          isAfter(dateObj, thisMonthStart) ||
          isSameDay(dateObj, thisMonthStart)
        ) {
          monthCount++;
        }
      });

      // Calculate Current Streak
      let currentStreak = 0;
      let checkDate = new Date();

      // If they haven't checked in today, check if they checked in yesterday to keep streak alive
      if (!datesSet.has(format(checkDate, "yyyy-MM-dd"))) {
        checkDate = subDays(checkDate, 1);
      }

      while (datesSet.has(format(checkDate, "yyyy-MM-dd"))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      setAttendedDates(datesSet);
      setStats({
        total: datesSet.size,
        streak: currentStreak,
        thisMonth: monthCount,
      });
      setLoading(false);
    };

    fetchAttendance();
  }, [memberId]);

  // Generate Graph Dates (Last ~6 Months aligned to Sunday)
  const today = new Date();
  const startDate = startOfWeek(subDays(today, 180)); // Go back 180 days, snap to Sunday
  const calendarDays = eachDayOfInterval({ start: startDate, end: today });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 bg-background border border-border rounded-2xl">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-card rounded-xl text-gold-500">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Visits</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
        </div>

        <div className="bg-background border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-card rounded-xl text-orange-500">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Current Streak</p>
            <p className="text-2xl font-bold text-foreground">{stats.streak} days</p>
          </div>
        </div>

        <div className="bg-background border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-card rounded-xl text-blue-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">This Month</p>
            <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
          </div>
        </div>
      </div>

      {/* Heatmap Graph */}
      <div className="bg-background border border-border rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-foreground mb-6">Activity Heatmap</h3>

        <div className="w-full overflow-x-auto no-scrollbar pb-4">
          <div className="min-w-max">
            {/* Day Labels (Mon, Wed, Fri) */}
            <div className="flex text-xs text-muted-foreground font-medium mb-2 gap-2">
              <div className="w-6" /> {/* Spacer for labels */}
              <div className="flex-1 flex justify-between px-2">
                <span>6 Months Ago</span>
                <span>Today</span>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Y-Axis Labels */}
              <div className="grid grid-rows-7 gap-1.5 text-[10px] text-foreground0 font-medium pr-2 text-right pt-1">
                <span className="leading-[14px]">Sun</span>
                <span className="leading-[14px]"></span>
                <span className="leading-[14px]">Tue</span>
                <span className="leading-[14px]"></span>
                <span className="leading-[14px]">Thu</span>
                <span className="leading-[14px]"></span>
                <span className="leading-[14px]">Sat</span>
              </div>

              {/* The Grid */}
              <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                {calendarDays.map((day, idx) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const isAttended = attendedDates.has(dayStr);

                  return (
                    <div
                      key={idx}
                      title={`${format(day, "MMM do, yyyy")}${isAttended ? " - Attended" : ""}`}
                      className={`w-3.5 h-3.5 rounded-sm transition-colors duration-200 cursor-pointer hover:ring-2 hover:ring-white/30 ${
                        isAttended
                          ? "bg-gold-500 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                          : "bg-muted hover:bg-card"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
