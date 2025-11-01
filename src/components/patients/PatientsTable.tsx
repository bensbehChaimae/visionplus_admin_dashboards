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
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  medical_record_number: string | null;
  home_address: string | null;
  status: string | null;
}

interface PatientsTableProps {
  searchQuery: string;
}

const PatientsTable = ({ searchQuery }: PatientsTableProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchPatients = async () => {
    setLoading(true);
    let query = supabase.from("patients_records").select("*").order("medical_record_number", { ascending: true });

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email_address.ilike.%${searchQuery}%,medical_record_number.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel("patients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients_records" }, fetchPatients)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    // Optimistic update
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    
    const { error } = await supabase
      .from("patients_records")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
      // Revert on error
      fetchPatients();
    } else {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from("patients_records").delete().eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      setDeleteId(null);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted-foreground">Loading patients...</Card>;
  }

  if (patients.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        {searchQuery ? "No patients found matching your search" : "No patients yet. Add your first patient!"}
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MRN</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Home Address</TableHead>
              <TableHead>Record Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-mono text-sm">
                  {patient.medical_record_number || "N/A"}
                </TableCell>
                <TableCell className="font-medium">
                  {patient.first_name} {patient.last_name}
                </TableCell>
                <TableCell>{patient.email_address || "N/A"}</TableCell>
                <TableCell>{patient.phone_number || "N/A"}</TableCell>
                <TableCell>
                  {patient.date_of_birth
                    ? new Date(patient.date_of_birth).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>{patient.home_address || "N/A"}</TableCell>
                <TableCell>
                  <Select
                    value={patient.status || "Pending"}
                    onValueChange={(value) => handleStatusUpdate(patient.id, value)}
                  >
                    <SelectTrigger className={`w-32 ${
                      patient.status === "Confirmed" 
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" 
                        : patient.status === "Cancelled"
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(patient.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PatientsTable;
