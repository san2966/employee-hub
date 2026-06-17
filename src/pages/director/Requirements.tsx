import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData } from "@/hooks/useDirectorData";
import { Package, Check, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const Requirements = () => {
  const { requirements, updateRequirementStatus } = useDirectorData();

  return (
    <DirectorLayout title="Requirements">
      <div className="space-y-4">
        {requirements.length === 0 ? (
          <div className="card-corporate p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No Requirements Yet</p>
            <p className="text-muted-foreground mt-2">
              Requirements raised by employees will appear here
            </p>
          </div>
        ) : (
          <div className="card-corporate overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Name</th>
                    <th className="text-left p-4 text-sm font-medium">Title</th>
                    <th className="text-left p-4 text-sm font-medium">Description</th>
                    <th className="text-left p-4 text-sm font-medium">Why Needed</th>
                    <th className="text-left p-4 text-sm font-medium">Link</th>
                    <th className="text-left p-4 text-sm font-medium">Cost</th>
                    <th className="text-left p-4 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requirements.map(req => (
                    <tr key={req.id} className="hover:bg-muted/30">
                      <td className="p-4 text-sm font-medium">{req.employeeName}</td>
                      <td className="p-4 text-sm">{req.title}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                        {req.description}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                        {req.whyNeeded || "—"}
                      </td>
                      <td className="p-4 text-sm">
                        {req.link ? (
                          <a href={req.link} target="_blank" rel="noopener noreferrer"
                             className="text-primary hover:underline inline-flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> Open
                          </a>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-sm">
                        {req.expectedCost ? `₹${req.expectedCost.toLocaleString()}` : "—"}
                      </td>
                      <td className="p-4">
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="default"
                              onClick={() => updateRequirementStatus(req.id, "approved")}>
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => updateRequirementStatus(req.id, "rejected")}>
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            req.status === "approved" ? "bg-success/10 text-success" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DirectorLayout>
  );
};

export default Requirements;
