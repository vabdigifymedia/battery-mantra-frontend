import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { CheckCircle2, PhoneCall, Clock, Building2, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EnquiryStatus, EnquiryResponse } from "@/types/dto";

export const Route = createFileRoute("/admin/enquiries")({
  component: AdminEnquiries,
});

function AdminEnquiries() {
  const queryClient = useQueryClient();
  const { data: quotations, isLoading: isLoadingQuotations } = useQuery({
    queryKey: ["admin", "enquiries", "QUOTATION"],
    queryFn: () => adminService.getAllEnquiries("QUOTATION"),
  });

  const { data: corporate, isLoading: isLoadingCorporate } = useQuery({
    queryKey: ["admin", "enquiries", "CORPORATE"],
    queryFn: () => adminService.getAllEnquiries("CORPORATE"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnquiryStatus }) =>
      adminService.updateEnquiryStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      toast.success("Enquiry marked as " + variables.status.toLowerCase());
    },
    onError: () => {
      toast.error("Failed to update status.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Product Enquiries</h1>
          <p className="text-muted-foreground mt-1">Manage quotation and B2B corporate requests.</p>
        </div>
      </div>

      <Tabs defaultValue="quotations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotations" className="gap-2">
            <FileText className="h-4 w-4" />
            Quotations
          </TabsTrigger>
          <TabsTrigger value="corporate" className="gap-2">
            <Building2 className="h-4 w-4" />
            Corporate (B2B)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations" className="space-y-4">
          <div className="rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product & Qty</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingQuotations ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !quotations || quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No quotation requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <div className="font-medium">{q.name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <PhoneCall className="w-3 h-3" /> {q.mobileNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{q.productName || "General Enquiry"}</div>
                        <div className="text-xs text-muted-foreground mt-1">Qty: {q.quantity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Clock className="w-4 h-4" />
                          {format(new Date(q.createdAt), "PPp")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            q.status === "RESOLVED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {q.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {q.status === "PENDING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatus.mutate({ id: q.id.toString(), status: "RESOLVED" })
                            }
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
                            Mark Resolved
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground pr-2">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="corporate" className="space-y-4">
          <div className="rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Product & Qty</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCorporate ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !corporate || corporate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No corporate enquiries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  corporate.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-bold flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-primary" />
                          {c.companyName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {c.name} ({c.mobileNumber})
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{c.productName || "General Enquiry"}</div>
                        <div className="text-xs text-muted-foreground mt-1">Est Qty: {c.quantity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Clock className="w-4 h-4" />
                          {format(new Date(c.createdAt), "PPp")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            c.status === "RESOLVED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === "PENDING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatus.mutate({ id: c.id.toString(), status: "RESOLVED" })
                            }
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
                            Mark Resolved
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground pr-2">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
