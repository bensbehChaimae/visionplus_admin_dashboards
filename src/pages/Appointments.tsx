import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";
import AppointmentsCalendar from "@/components/appointments/AppointmentsCalendar";
import AddAppointmentDialog from "@/components/appointments/AddAppointmentDialog";

const Appointments = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage patient appointments
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>
        </div>

        <AppointmentsTable />

        <div className="mt-8">
          <AppointmentsCalendar />
        </div>

        <AddAppointmentDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default Appointments;