import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, UserPlus, Clock, Calendar, FileText, Briefcase } from "lucide-react";

const HRDashboard = () => {
  const recentHires = [
    { name: "John Smith", position: "Software Engineer", date: "Jan 15, 2026" },
    { name: "Sarah Johnson", position: "Marketing Manager", date: "Jan 10, 2026" },
    { name: "Mike Chen", position: "Product Designer", date: "Jan 5, 2026" },
  ];

  const pendingRequests = [
    { type: "Leave Request", employee: "Emma Wilson", days: 5 },
    { type: "Training Request", employee: "David Brown", days: 3 },
    { type: "WFH Request", employee: "Lisa Taylor", days: 2 },
  ];

  return (
    <DashboardLayout title="HR Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Human Resources Hub</h2>
          <p className="opacity-90">Manage employee profiles, recruitment, and HR operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value="248"
            icon={Users}
            trend="8 new this month"
            trendUp={true}
          />
          <StatCard
            title="Open Positions"
            value="12"
            icon={Briefcase}
          />
          <StatCard
            title="Pending Requests"
            value="23"
            icon={Clock}
          />
          <StatCard
            title="Interviews Today"
            value="5"
            icon={Calendar}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Hires */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recent Hires</h3>
            </div>
            <div className="space-y-4">
              {recentHires.map((hire, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {hire.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{hire.name}</p>
                    <p className="text-sm text-muted-foreground">{hire.position}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{hire.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Pending Requests</h3>
            </div>
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{request.type}</p>
                    <p className="text-sm text-muted-foreground">{request.employee}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{request.days} days</span>
                    <button className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:opacity-90 transition-opacity">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
