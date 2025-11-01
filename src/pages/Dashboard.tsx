import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    upcomingAppointments: 0,
    confirmedToday: 0,
    pendingConfirmations: 0,
    cancelledAppointments: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [patientsRes, appointmentsRes, todayAppointments, pendingRes, cancelledRes] = await Promise.all([
        supabase.from("patients_records").select("id", { count: "exact", head: true }),
        supabase.from("appointments_records").select("id", { count: "exact", head: true }).gte("appointment_date", today),
        supabase.from("appointments_records").select("id", { count: "exact", head: true }).eq("appointment_date", today).eq("status", "Confirmed"),
        supabase.from("appointments_records").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("appointments_records").select("id", { count: "exact", head: true }).eq("status", "Cancelled"),
      ]);

      setStats({
        totalPatients: patientsRes.count || 0,
        upcomingAppointments: appointmentsRes.count || 0,
        confirmedToday: todayAppointments.count || 0,
        pendingConfirmations: pendingRes.count || 0,
        cancelledAppointments: cancelledRes.count || 0,
      });
    };

    fetchStats();

    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients_records" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments_records" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's happening in your clinic today.
          </p>
        </div>

        <StatsCards stats={stats} />

        <Card>
          <CardHeader>
            <CardTitle>Administrator Profile</CardTitle>
            <CardDescription>Your account and system access information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage 
                  src={user.user_metadata?.avatar_url} 
                  alt={user.user_metadata?.full_name || "Admin"} 
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user.user_metadata?.full_name || user.email || "A")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">
                      {user.user_metadata?.full_name || "System Administrator"}
                    </h3>
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.user_metadata?.phone || "No phone number"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                    <p className="text-sm font-semibold">
                      {new Date(user.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Account Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="text-sm font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Access Level</p>
                    <p className="text-sm font-semibold">Full Access</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Department</p>
                    <p className="text-sm font-semibold">
                      {user.user_metadata?.department || "Administration"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Role Description</p>
                    <p className="text-sm font-semibold">System Management & Oversight</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
