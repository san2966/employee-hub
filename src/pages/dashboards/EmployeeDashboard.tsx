import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Calendar, Clock, FileText, CheckCircle, MessageSquare, Trophy } from "lucide-react";

const EmployeeDashboard = () => {
  const upcomingEvents = [
    { title: "Team Meeting", time: "10:00 AM", date: "Today" },
    { title: "Project Review", time: "2:00 PM", date: "Tomorrow" },
    { title: "Training Session", time: "11:00 AM", date: "Jan 22" },
  ];

  const recentPayslips = [
    { month: "January 2026", amount: "$4,850", status: "Paid" },
    { month: "December 2025", amount: "$4,850", status: "Paid" },
    { month: "November 2025", amount: "$4,650", status: "Paid" },
  ];

  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">My Workspace</h2>
          <p className="opacity-90">View your payslips, submit requests, and stay updated</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Leave Balance"
            value="18 days"
            icon={Calendar}
          />
          <StatCard
            title="Pending Requests"
            value="2"
            icon={Clock}
          />
          <StatCard
            title="Tasks Completed"
            value="24"
            icon={CheckCircle}
            trend="This month"
            trendUp={true}
          />
          <StatCard
            title="Performance Score"
            value="92%"
            icon={Trophy}
            trend="Above average"
            trendUp={true}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Upcoming Events</h3>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs text-primary font-medium">{event.date}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payslips */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recent Payslips</h3>
            </div>
            <div className="space-y-4">
              {recentPayslips.map((payslip, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{payslip.month}</p>
                    <p className="text-sm text-muted-foreground">{payslip.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                      {payslip.status}
                    </span>
                    <button className="text-sm text-primary hover:underline">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-corporate p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "Apply Leave",
              "Submit Expense",
              "Request WFH",
              "View Benefits",
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

export default EmployeeDashboard;
