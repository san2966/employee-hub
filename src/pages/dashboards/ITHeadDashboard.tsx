import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Server, Ticket, AlertTriangle, CheckCircle, HardDrive, Wifi } from "lucide-react";

const ITHeadDashboard = () => {
  const tickets = [
    { id: "TKT-001", title: "Email not syncing", priority: "High", status: "Open" },
    { id: "TKT-002", title: "VPN connection issues", priority: "Medium", status: "In Progress" },
    { id: "TKT-003", title: "New laptop setup", priority: "Low", status: "Open" },
    { id: "TKT-004", title: "Software installation request", priority: "Low", status: "Resolved" },
  ];

  const infrastructure = [
    { name: "Primary Server", status: "Online", load: "45%" },
    { name: "Backup Server", status: "Online", load: "12%" },
    { name: "Network Gateway", status: "Online", load: "32%" },
    { name: "Storage Array", status: "Warning", load: "87%" },
  ];

  return (
    <DashboardLayout title="IT Head Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">IT Management Center</h2>
          <p className="opacity-90">Monitor infrastructure and manage support tickets</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Open Tickets"
            value="24"
            icon={Ticket}
            trend="5 urgent"
          />
          <StatCard
            title="Resolved Today"
            value="12"
            icon={CheckCircle}
            trend="85% SLA met"
            trendUp={true}
          />
          <StatCard
            title="System Alerts"
            value="3"
            icon={AlertTriangle}
          />
          <StatCard
            title="Server Uptime"
            value="99.9%"
            icon={Server}
            trend="Last 30 days"
            trendUp={true}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Support Tickets */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recent Tickets</h3>
            </div>
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ticket.priority === "High" ? "bg-destructive/10 text-destructive" :
                        ticket.priority === "Medium" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="font-medium text-foreground mt-1">{ticket.title}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.status === "Resolved" ? "bg-success/10 text-success" :
                    ticket.status === "In Progress" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Status */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Infrastructure Status</h3>
            </div>
            <div className="space-y-4">
              {infrastructure.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === "Online" ? "bg-success" : "bg-warning"
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            parseInt(item.load) > 80 ? "bg-warning" : "bg-primary"
                          }`}
                          style={{ width: item.load }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.load}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-corporate p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "View All Tickets",
              "Server Monitoring",
              "Network Status",
              "Backup Status",
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

export default ITHeadDashboard;
