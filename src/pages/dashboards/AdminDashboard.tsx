import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, Shield, Settings, Activity, Database, Lock } from "lucide-react";

const AdminDashboard = () => {
  const systemStatus = [
    { name: "Authentication Server", status: "Operational", uptime: "99.9%" },
    { name: "Database Server", status: "Operational", uptime: "99.8%" },
    { name: "File Storage", status: "Operational", uptime: "99.9%" },
    { name: "Email Service", status: "Degraded", uptime: "95.2%" },
  ];

  const recentActivity = [
    { action: "User Created", user: "john.smith", time: "2 hours ago" },
    { action: "Role Updated", user: "sarah.johnson", time: "4 hours ago" },
    { action: "Password Reset", user: "mike.chen", time: "Yesterday" },
    { action: "Account Locked", user: "emma.wilson", time: "2 days ago" },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">System Administration</h2>
          <p className="opacity-90">Manage users, roles, and system configurations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value="312"
            icon={Users}
            trend="12 pending approval"
            trendUp={true}
          />
          <StatCard
            title="Active Sessions"
            value="89"
            icon={Activity}
          />
          <StatCard
            title="System Uptime"
            value="99.8%"
            icon={Shield}
            trend="Last 30 days"
            trendUp={true}
          />
          <StatCard
            title="Security Alerts"
            value="3"
            icon={Lock}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">System Status</h3>
            </div>
            <div className="space-y-4">
              {systemStatus.map((system, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{system.name}</p>
                    <p className="text-sm text-muted-foreground">Uptime: {system.uptime}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    system.status === "Operational" 
                      ? "bg-success/10 text-success" 
                      : "bg-warning/10 text-warning"
                  }`}>
                    {system.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">@{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="card-corporate p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Quick Admin Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "Manage Users",
              "Role Permissions",
              "System Settings",
              "Audit Logs",
            ].map((action, index) => (
              <button
                key={index}
                className="px-4 py-3 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium text-center"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
