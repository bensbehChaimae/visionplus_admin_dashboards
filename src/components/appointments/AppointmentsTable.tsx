import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

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

const AppointmentsTable = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments_records")
      .select(`
        *,
        patient:patients_records!appointments_records_patient_id_fkey(first_name, last_name)
      `)
      .order("appointment_date", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } else {
      setAppointments(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments_records" }, fetchAppointments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    const { error } = await supabase
      .from("appointments_records")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
      // Revert on error
      fetchAppointments();
    } else {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("appointments_records").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
    }
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case "Confirmed":
        return "default";
      case "Pending":
        return "secondary";
      case "Cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted-foreground">Loading appointments...</Card>;
  }

  if (appointments.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No appointments yet. Schedule your first appointment!
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell className="font-medium">
                {appointment.patient
                  ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                  : "Unknown Patient"}
              </TableCell>
              <TableCell>
                {appointment.appointment_date ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-sm font-semibold text-foreground">
                      {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {format(new Date(appointment.appointment_date), "h:mm a")}
                    </div>
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>{appointment.appointment_type || "N/A"}</TableCell>
                <TableCell>
                  <Select
                    value={appointment.status || "Pending"}
                    onValueChange={(value) => handleStatusUpdate(appointment.id, value)}
                  >
                    <SelectTrigger className={`w-32 ${
                      appointment.status === "Confirmed" 
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" 
                        : appointment.status === "Cancelled"
                        ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending" className="text-yellow-700 dark:text-yellow-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem value="Confirmed" className="text-green-700 dark:text-green-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Confirmed
                        </span>
                      </SelectItem>
                      <SelectItem value="Cancelled" className="text-red-700 dark:text-red-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Cancelled
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              <TableCell className="max-w-xs truncate">
                {appointment.notes || "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(appointment.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default AppointmentsTable;
