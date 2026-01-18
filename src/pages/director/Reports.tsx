import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData } from "@/hooks/useDirectorData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";

const Reports = () => {
  const { employees, tasks } = useDirectorData();
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp?.name || "Unknown";
  };

  const getEmployeeDepartment = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp?.department || "N/A";
  };

  const filteredTasks = tasks.filter(task => {
    if (filterEmployee !== "all" && task.employeeId !== filterEmployee) return false;
    if (filterDate && !task.createdAt.startsWith(filterDate)) return false;
    return true;
  });

  return (
    <DirectorLayout title="Reports">
      <div className="space-y-6">
        {/* Filters */}
        <div className="card-corporate p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Employee Name</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="card-corporate overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Employee Name</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Department</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Task</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No reports found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-muted/30">
                      <td className="p-4 text-sm">{getEmployeeName(task.employeeId)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {getEmployeeDepartment(task.employeeId)}
                      </td>
                      <td className="p-4 text-sm font-medium">{task.subject}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          task.status === "completed" ? "bg-success/10 text-success" :
                          task.status === "in-progress" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {task.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                        {task.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DirectorLayout>
  );
};

export default Reports;
