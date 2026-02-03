import { useNavigate } from "react-router-dom";
import HRLayout from "@/components/hr/HRLayout";
import { useHRData } from "@/hooks/useHRData";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";

const HRDashboard = () => {
  const navigate = useNavigate();
  const { employees } = useHRData();

  return (
    <HRLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">HR Dashboard</h2>
          <p className="opacity-90">Manage employees and track workforce data</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {employees.filter(e => {
                    const joinDate = new Date(e.dateOfJoining);
                    const now = new Date();
                    return joinDate.getMonth() === now.getMonth() && 
                           joinDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm flex items-center justify-center">
            <Button onClick={() => navigate("/hr/employee-add")} className="gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Employee
            </Button>
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Employee List</h3>
              <p className="text-sm text-muted-foreground">Click on employee name to view details</p>
            </div>
            <ExportButtons
              portal="HR"
              type="Employees"
              columns={EXPORT_COLUMNS.employees}
              data={employees}
            />
          </div>
          
          {employees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No Employees Yet</h4>
              <p className="text-muted-foreground mb-4">
                Start by adding your first employee to the system.
              </p>
              <Button onClick={() => navigate("/hr/employee-add")} className="gap-2">
                <UserPlus className="h-5 w-5" />
                Add Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Email ID</TableHead>
                    <TableHead>Phone Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <button
                          onClick={() => navigate(`/hr/manage-employee?id=${employee.id}`)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {employee.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{employee.username}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                      <TableCell className="text-muted-foreground">{employee.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
};

export default HRDashboard;
