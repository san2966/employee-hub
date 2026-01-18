import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData } from "@/hooks/useDirectorData";
import { Package } from "lucide-react";

const Requirements = () => {
  const { requirements } = useDirectorData();

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
                    <th className="text-left p-4 text-sm font-medium">Employee</th>
                    <th className="text-left p-4 text-sm font-medium">Title</th>
                    <th className="text-left p-4 text-sm font-medium">Description</th>
                    <th className="text-left p-4 text-sm font-medium">Date</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
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
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          req.status === "approved" ? "bg-success/10 text-success" :
                          req.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>
                          {req.status}
                        </span>
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
