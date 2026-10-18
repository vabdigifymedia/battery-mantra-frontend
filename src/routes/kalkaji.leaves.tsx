import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Check, X, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LeaveStatus } from "@/types/dto";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const Route = createFileRoute("/admin/leaves")({
  component: AdminLeaves,
});

function AdminLeaves() {
  const queryClient = useQueryClient();
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);

  const { data: leaves, isLoading } = useQuery({
    queryKey: ["admin", "leaves"],
    queryFn: () => adminService.getAllLeaveRequests(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeaveStatus }) =>
      adminService.updateLeaveStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaves"] });
      toast.success(`Leave request ${actionType === "APPROVE" ? "approved" : "rejected"}.`);
      setSelectedLeaveId(null);
      setActionType(null);
    },
    onError: () => toast.error("Failed to update leave request."),
  });

  const handleAction = (id: string, type: "APPROVE" | "REJECT") => {
    setSelectedLeaveId(id);
    setActionType(type);
  };

  const confirmAction = () => {
    if (selectedLeaveId && actionType) {
      updateMutation.mutate({ 
        id: selectedLeaveId, 
        status: actionType === "APPROVE" ? "APPROVED" : "REJECTED" 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Leave Requests</h2>
        <p className="text-muted-foreground">Manage leave requests from your field engineers.</p>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Engineer</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading leave requests...
                </TableCell>
              </TableRow>
            ) : !leaves?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <CalendarOff className="h-8 w-8 mb-2 opacity-20" />
                    No leave requests found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((leave) => {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="font-medium">{leave.engineer?.firstName} {leave.engineer?.lastName}</div>
                      <div className="text-xs text-muted-foreground">{leave.engineer?.user?.phoneNumber || "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(start, "dd MMM yyyy")} - {format(end, "dd MMM yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {diffDays} {diffDays === 1 ? "day" : "days"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                      {leave.reason}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(leave.appliedAt), "dd MMM yyyy, p")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          leave.status === "PENDING"
                            ? "bg-warning/20 text-warning"
                            : leave.status === "APPROVED"
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                        )}
                      >
                        {leave.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {leave.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-success hover:bg-success/10 hover:text-success hover:border-success/50"
                                onClick={() => handleAction(leave.id, "APPROVE")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve this leave request from {leave.engineer?.firstName}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmAction} className="bg-success hover:bg-success/90">
                                  Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                onClick={() => handleAction(leave.id, "REJECT")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject this leave request from {leave.engineer?.firstName}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmAction} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
