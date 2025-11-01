import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, User } from "lucide-react";

interface Appointment {
  id: number;
  patient_id: number | null;
  appointment_date: string | null;
  appointment_type: string | null;
  status: string | null;
  notes: string | null;
  patient: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const AppointmentsCalendar = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments_records")
      .select(`
        *,
        patient:patients_records!appointments_records_patient_id_fkey(first_name, last_name)
      `)
      .order("appointment_date", { ascending: true });

    if (!error && data) {
      setAppointments(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-calendar-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments_records" }, fetchAppointments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get appointments for selected date
  const selectedDateAppointments = appointments.filter(
    (apt) => apt.appointment_date && isSameDay(parseISO(apt.appointment_date), selectedDate)
  );

  // Get dates that have appointments
  const appointmentDates = appointments
    .filter((apt) => apt.appointment_date)
    .map((apt) => parseISO(apt.appointment_date!));

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      case "Pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case "Cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted-foreground">Loading calendar...</Card>;
  }

  return (
    <div className="grid md:grid-cols-[400px_1fr] gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Appointment Calendar</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border"
          modifiers={{
            hasAppointment: appointmentDates,
          }}
          modifiersClassNames={{
            hasAppointment: "bg-primary/10 font-bold",
          }}
        />
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/10 border border-primary/30"></div>
            <span>Days with appointments</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Appointments for {format(selectedDate, "MMMM dd, yyyy")}
        </h3>
        
        {selectedDateAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No appointments scheduled for this date
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDateAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {appointment.patient
                        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                        : "Unknown Patient"}
                    </span>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status || "Pending"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {appointment.appointment_date
                        ? format(parseISO(appointment.appointment_date), "h:mm a")
                        : "N/A"}
                    </span>
                  </div>

                  {appointment.appointment_type && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Type:</span> {appointment.appointment_type}
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AppointmentsCalendar;
