import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { DollarSign, CreditCard, FileText, TrendingUp, Receipt, Wallet } from "lucide-react";

const AccountsDashboard = () => {
  const recentTransactions = [
    { description: "Payroll - January", amount: "$145,200", type: "expense", date: "Jan 15, 2026" },
    { description: "Client Payment - ABC Corp", amount: "$32,500", type: "income", date: "Jan 14, 2026" },
    { description: "Office Supplies", amount: "$1,250", type: "expense", date: "Jan 12, 2026" },
    { description: "Software Subscriptions", amount: "$3,400", type: "expense", date: "Jan 10, 2026" },
  ];

  return (
    <DashboardLayout title="Accounts Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Financial Overview</h2>
          <p className="opacity-90">Manage payroll, expenses, and financial operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Payroll"
            value="$145.2K"
            icon={Wallet}
          />
          <StatCard
            title="Pending Invoices"
            value="$28.5K"
            icon={FileText}
          />
          <StatCard
            title="Monthly Revenue"
            value="$312K"
            icon={DollarSign}
            trend="8% increase"
            trendUp={true}
          />
          <StatCard
            title="Expenses"
            value="$89.3K"
            icon={CreditCard}
            trend="3% decrease"
            trendUp={true}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recent Transactions</h3>
            </div>
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === "income" ? "text-success" : "text-foreground"
                  }`}>
                    {transaction.type === "income" ? "+" : "-"}{transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-corporate p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              {[
                "Generate Payslips",
                "Create Invoice",
                "Expense Report",
                "Tax Summary",
              ].map((action, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountsDashboard;
