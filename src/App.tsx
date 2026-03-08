import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";

// Director Module
import DirectorLogin from "./pages/director/DirectorLogin";
import DirectorDashboard from "./pages/director/DirectorDashboard";
import TaskManager from "./pages/director/TaskManager";
import Reports from "./pages/director/Reports";
import Notices from "./pages/director/Notices";
import LeaveManager from "./pages/director/LeaveManager";
import Requirements from "./pages/director/Requirements";
import ProductManager from "./pages/director/ProductManager";
import Contacts from "./pages/director/Contacts";
import Settings from "./pages/director/Settings";

// HR Module
import HRLogin from "./pages/hr/HRLogin";
import HRDashboardPage from "./pages/hr/HRDashboard";
import EmployeeAdd from "./pages/hr/EmployeeAdd";
import ManageEmployee from "./pages/hr/ManageEmployee";
import HRSettings from "./pages/hr/HRSettings";
import HRLeaveManager from "./pages/hr/HRLeaveManager";

// Accounts Module
import AccountsLogin from "./pages/accounts/AccountsLogin";
import AccountsDashboardPage from "./pages/accounts/AccountsDashboard";
import Vouchers from "./pages/accounts/Vouchers";
import AccountsSettings from "./pages/accounts/AccountsSettings";

// Employee Module
import EmployeeLogin from "./pages/employee/EmployeeLogin";
import EmployeeDashboardPage from "./pages/employee/EmployeeDashboard";
import EmployeeTaskManager from "./pages/employee/EmployeeTaskManager";
import EmployeeContacts from "./pages/employee/EmployeeContacts";
import EmployeeRequirements from "./pages/employee/EmployeeRequirements";
import EmployeePayments from "./pages/employee/EmployeePayments";
import EmployeeNotice from "./pages/employee/EmployeeNotice";
import EmployeeLeaveManager from "./pages/employee/EmployeeLeaveManager";
import EmployeeReports from "./pages/employee/EmployeeReports";
import EmployeeSettings from "./pages/employee/EmployeeSettings";

// Admin Module
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboardPage from "./pages/admin/AdminDashboard";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminVisitors from "./pages/admin/AdminVisitors";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminInwardOutward from "./pages/admin/AdminInwardOutward";
import AdminAssets from "./pages/admin/AdminAssets";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminSettings from "./pages/admin/AdminSettings";

// Other Dashboards
import HRDashboard from "./pages/dashboards/HRDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import NotFound from "./pages/NotFound";

// Tender Module
import TenderLogin from "./pages/tender/TenderLogin";
import TenderDashboard from "./pages/tender/TenderDashboard";
import TenderTaskManager from "./pages/tender/TenderTaskManager";
import TenderCompanyManager from "./pages/tender/TenderCompanyManager";
import TenderDocuments from "./pages/tender/TenderDocuments";
import TenderManager from "./pages/tender/TenderManager";
import TenderProductManager from "./pages/tender/TenderProductManager";
import TenderResearch from "./pages/tender/TenderResearch";
import TenderContacts from "./pages/tender/TenderContacts";
import TenderSettings from "./pages/tender/TenderSettings";

// Director Tender Monitor & Record Management
import TenderMonitor from "./pages/director/TenderMonitor";
import DirectorRecordManagement from "./pages/director/RecordManagement";

// IT Head Module
import ITHeadLogin from "./pages/ithead/ITHeadLogin";
import ITHeadDashboard from "./pages/ithead/ITHeadDashboard";
import ITHeadTickets from "./pages/ithead/ITHeadTickets";
import ITHeadAssets from "./pages/ithead/ITHeadAssets";
import ITHeadPasswords from "./pages/ithead/ITHeadPasswords";
import ITHeadNetwork from "./pages/ithead/ITHeadNetwork";
import ITHeadTelephone from "./pages/ithead/ITHeadTelephone";
import ITHeadSettings from "./pages/ithead/ITHeadSettings";

// Purchase Module
import PurchaseLogin from "./pages/purchase/PurchaseLogin";
import PurchaseDashboard from "./pages/purchase/PurchaseDashboard";
import PurchaseTaskManager from "./pages/purchase/PurchaseTaskManager";
import PurchaseQuotationManager from "./pages/purchase/PurchaseQuotationManager";
import PurchaseProductManager from "./pages/purchase/PurchaseProductManager";
import PurchaseContacts from "./pages/purchase/PurchaseContacts";
import PurchaseDispatch from "./pages/purchase/PurchaseDispatch";
import PurchaseDocuments from "./pages/purchase/PurchaseDocuments";
import PurchaseTechnicalSupport from "./pages/purchase/PurchaseTechnicalSupport";
import PurchaseSettings from "./pages/purchase/PurchaseSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          
          {/* Director Routes */}
          <Route path="/login/director" element={<DirectorLogin />} />
          <Route path="/director/dashboard" element={<DirectorDashboard />} />
          <Route path="/director/tasks" element={<TaskManager />} />
          <Route path="/director/reports" element={<Reports />} />
          <Route path="/director/notices" element={<Notices />} />
          <Route path="/director/leaves" element={<LeaveManager />} />
          <Route path="/director/requirements" element={<Requirements />} />
          <Route path="/director/products" element={<ProductManager />} />
          <Route path="/director/contacts" element={<Contacts />} />
          <Route path="/director/tender-monitor" element={<TenderMonitor />} />
          <Route path="/director/settings" element={<Settings />} />
          
          {/* HR Routes */}
          <Route path="/login/hr" element={<HRLogin />} />
          <Route path="/hr/dashboard" element={<HRDashboardPage />} />
          <Route path="/hr/employee-add" element={<EmployeeAdd />} />
          <Route path="/hr/manage-employee" element={<ManageEmployee />} />
          <Route path="/hr/leaves" element={<HRLeaveManager />} />
          <Route path="/hr/settings" element={<HRSettings />} />
          
          {/* Accounts Routes */}
          <Route path="/login/accounts" element={<AccountsLogin />} />
          <Route path="/accounts/dashboard" element={<AccountsDashboardPage />} />
          <Route path="/accounts/vouchers" element={<Vouchers />} />
          <Route path="/accounts/settings" element={<AccountsSettings />} />
          
          {/* Employee Routes */}
          <Route path="/login/employee" element={<EmployeeLogin />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
          <Route path="/employee/tasks" element={<EmployeeTaskManager />} />
          <Route path="/employee/contacts" element={<EmployeeContacts />} />
          <Route path="/employee/requirements" element={<EmployeeRequirements />} />
          <Route path="/employee/payments" element={<EmployeePayments />} />
          <Route path="/employee/notices" element={<EmployeeNotice />} />
          <Route path="/employee/leaves" element={<EmployeeLeaveManager />} />
          <Route path="/employee/reports" element={<EmployeeReports />} />
          <Route path="/employee/settings" element={<EmployeeSettings />} />
          
          {/* Admin Routes */}
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/tasks" element={<AdminTasks />} />
          <Route path="/admin/visitors" element={<AdminVisitors />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/inward-outward" element={<AdminInwardOutward />} />
          <Route path="/admin/assets" element={<AdminAssets />} />
          <Route path="/admin/vehicles" element={<AdminVehicles />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* IT Head Routes */}
          <Route path="/login/ithead" element={<ITHeadLogin />} />
          <Route path="/ithead/dashboard" element={<ITHeadDashboard />} />
          <Route path="/ithead/tickets" element={<ITHeadTickets />} />
          <Route path="/ithead/assets" element={<ITHeadAssets />} />
          <Route path="/ithead/passwords" element={<ITHeadPasswords />} />
          <Route path="/ithead/network" element={<ITHeadNetwork />} />
          <Route path="/ithead/telephone" element={<ITHeadTelephone />} />
          <Route path="/ithead/settings" element={<ITHeadSettings />} />
          
          {/* Tender Routes */}
          <Route path="/login/tender" element={<TenderLogin />} />
          <Route path="/tender/dashboard" element={<TenderDashboard />} />
          <Route path="/tender/tasks" element={<TenderTaskManager />} />
          <Route path="/tender/companies" element={<TenderCompanyManager />} />
          <Route path="/tender/documents" element={<TenderDocuments />} />
          <Route path="/tender/tenders" element={<TenderManager />} />
          <Route path="/tender/products" element={<TenderProductManager />} />
          <Route path="/tender/research" element={<TenderResearch />} />
          <Route path="/tender/contacts" element={<TenderContacts />} />
          <Route path="/tender/settings" element={<TenderSettings />} />
          
          {/* Purchase Routes */}
          <Route path="/login/purchase" element={<PurchaseLogin />} />
          <Route path="/purchase/dashboard" element={<PurchaseDashboard />} />
          <Route path="/purchase/tasks" element={<PurchaseTaskManager />} />
          <Route path="/purchase/quotations" element={<PurchaseQuotationManager />} />
          <Route path="/purchase/products" element={<PurchaseProductManager />} />
          <Route path="/purchase/contacts" element={<PurchaseContacts />} />
          <Route path="/purchase/dispatch" element={<PurchaseDispatch />} />
          <Route path="/purchase/documents" element={<PurchaseDocuments />} />
          <Route path="/purchase/technical-support" element={<PurchaseTechnicalSupport />} />
          <Route path="/purchase/settings" element={<PurchaseSettings />} />
          
          {/* Other Dashboards */}
          <Route path="/dashboard/hr" element={<HRDashboard />} />
          <Route path="/dashboard/accounts" element={<AccountsDashboard />} />
          <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
