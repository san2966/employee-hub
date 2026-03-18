import { useNavigate } from "react-router-dom";
import HRLayout from "@/components/hr/HRLayout";
import { useHRData } from "@/hooks/useHRData";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";
import AttendanceCalendar from "@/components/hr/AttendanceCalendar";

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

        {/* Attendance Calendar */}
        <AttendanceCalendar />
      </div>
    </HRLayout>
  );
};

export default HRDashboard;
