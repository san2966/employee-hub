import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { TrendingUp, Users, DollarSign, Target, BarChart3, PieChart } from "lucide-react";

const DirectorDashboard = () => {
  return (
    <DashboardLayout title="Director Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Executive Overview</h2>
          <p className="opacity-90">Monitor key performance indicators and strategic insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value="$2.4M"
            icon={DollarSign}
            trend="12% from last month"
            trendUp={true}
          />
          <StatCard
            title="Active Employees"
            value="248"
            icon={Users}
            trend="8 new this month"
            trendUp={true}
          />
          <StatCard
            title="Goals Achieved"
            value="87%"
            icon={Target}
            trend="5% improvement"
            trendUp={true}
          />
          <StatCard
            title="Growth Rate"
            value="23%"
            icon={TrendingUp}
            trend="vs 18% last quarter"
            trendUp={true}
          />
        </div>

        {/* Reports Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Quarterly Performance</h3>
            </div>
            <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Performance chart placeholder</p>
            </div>
          </div>
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Department Breakdown</h3>
            </div>
            <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Department chart placeholder</p>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="card-corporate p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Strategic Updates</h3>
          <div className="space-y-4">
            {[
              { title: "Q4 Budget Approved", date: "Today", status: "Completed" },
              { title: "New Market Expansion Plan", date: "Yesterday", status: "In Review" },
              { title: "Annual Performance Review", date: "3 days ago", status: "Pending" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === "Completed" ? "bg-success/10 text-success" :
                  item.status === "In Review" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DirectorDashboard;
