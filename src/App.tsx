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
import HRAttendance from "./pages/hr/HRAttendance";
import HRDirectorTasks from "./pages/hr/HRDirectorTasks";

// Accounts Module
import AccountsLogin from "./pages/accounts/AccountsLogin";
import AccountsDashboardPage from "./pages/accounts/AccountsDashboard";
import Vouchers from "./pages/accounts/Vouchers";
import AccountsSettings from "./pages/accounts/AccountsSettings";
import AccountsDirectorTasks from "./pages/accounts/AccountsDirectorTasks";
import AccountsTenderPayments from "./pages/accounts/AccountsTenderPayments";

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
import AdminAttendance from "./pages/admin/AdminAttendance";

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
import TenderPaymentManagerPage from "./pages/tender/TenderPaymentManager";

// Director Tender Monitor & Record Management
import TenderMonitor from "./pages/director/TenderMonitor";
import DirectorQuotationManager from "./pages/director/QuotationManager";
import DirectorRecordManagement from "./pages/director/RecordManagement";
import DirectorAttendance from "./pages/director/DirectorAttendance";
import DirectorDepartmentTasks from "./pages/director/DirectorDepartmentTasks";
import DirectorGRManager from "./pages/director/GRManager";
import DirectorEOD from "./pages/director/EOD";

// IT Head Module
import ITHeadLogin from "./pages/ithead/ITHeadLogin";
import ITHeadDashboard from "./pages/ithead/ITHeadDashboard";
import ITHeadTickets from "./pages/ithead/ITHeadTickets";
import ITHeadAssets from "./pages/ithead/ITHeadAssets";
import ITHeadAssetTracker from "./pages/ithead/ITHeadAssetTracker";
import ITHeadPasswords from "./pages/ithead/ITHeadPasswords";
import ITHeadNetwork from "./pages/ithead/ITHeadNetwork";
import ITHeadTelephone from "./pages/ithead/ITHeadTelephone";
import ITHeadSettings from "./pages/ithead/ITHeadSettings";
import ITHeadDirectorTasks from "./pages/ithead/ITHeadDirectorTasks";

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

// Operations Module
import OperationsLogin from "./pages/operations/OperationsLogin";
import OperationsDashboard from "./pages/operations/OperationsDashboard";
import OperationsProposals from "./pages/operations/OperationsProposals";
import OperationsBrochures from "./pages/operations/OperationsBrochures";
import OperationsInwards from "./pages/operations/OperationsInwards";
import OperationsOutwards from "./pages/operations/OperationsOutwards";
import OperationsPresentations from "./pages/operations/OperationsPresentations";
import OperationsMedia from "./pages/operations/OperationsMedia";
import OperationsGR from "./pages/operations/OperationsGR";
import OperationsSettings from "./pages/operations/OperationsSettings";
import OperationsDirectorTasks from "./pages/operations/OperationsDirectorTasks";
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
          <Route path="/director/eod" element={<DirectorEOD />} />
          <Route path="/director/notices" element={<Notices />} />
          <Route path="/director/leaves" element={<LeaveManager />} />
          <Route path="/director/requirements" element={<Requirements />} />
          <Route path="/director/products" element={<ProductManager />} />
          <Route path="/director/contacts" element={<Contacts />} />
          <Route path="/director/tender-monitor" element={<TenderMonitor />} />
          <Route path="/director/quotations" element={<DirectorQuotationManager />} />
          <Route path="/director/records" element={<DirectorRecordManagement />} />
          <Route path="/director/settings" element={<Settings />} />
          <Route path="/director/attendance" element={<DirectorAttendance />} />
          <Route path="/director/department-tasks" element={<DirectorDepartmentTasks />} />
          <Route path="/director/gr" element={<DirectorGRManager />} />
          
          {/* HR Routes */}
          <Route path="/login/hr" element={<HRLogin />} />
          <Route path="/hr/dashboard" element={<HRDashboardPage />} />
          <Route path="/hr/employee-add" element={<EmployeeAdd />} />
          <Route path="/hr/manage-employee" element={<ManageEmployee />} />
          <Route path="/hr/leaves" element={<HRLeaveManager />} />
          <Route path="/hr/settings" element={<HRSettings />} />
          <Route path="/hr/attendance" element={<HRAttendance />} />
          <Route path="/hr/director-tasks" element={<HRDirectorTasks />} />
          
          {/* Accounts Routes */}
          <Route path="/login/accounts" element={<AccountsLogin />} />
          <Route path="/accounts/dashboard" element={<AccountsDashboardPage />} />
          <Route path="/accounts/vouchers" element={<Vouchers />} />
          <Route path="/accounts/settings" element={<AccountsSettings />} />
          <Route path="/accounts/director-tasks" element={<AccountsDirectorTasks />} />
          <Route path="/accounts/tender-payments" element={<AccountsTenderPayments />} />
          
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
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          
          {/* IT Head Routes */}
          <Route path="/login/ithead" element={<ITHeadLogin />} />
          <Route path="/ithead/dashboard" element={<ITHeadDashboard />} />
          <Route path="/ithead/tickets" element={<ITHeadTickets />} />
          <Route path="/ithead/assets" element={<ITHeadAssets />} />
          <Route path="/ithead/asset-tracker" element={<ITHeadAssetTracker />} />
          <Route path="/ithead/passwords" element={<ITHeadPasswords />} />
          <Route path="/ithead/network" element={<ITHeadNetwork />} />
          <Route path="/ithead/telephone" element={<ITHeadTelephone />} />
          <Route path="/ithead/settings" element={<ITHeadSettings />} />
          <Route path="/ithead/director-tasks" element={<ITHeadDirectorTasks />} />
          
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
          <Route path="/tender/payments" element={<TenderPaymentManagerPage />} />
          
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
          
          {/* Operations Routes */}
          <Route path="/login/operations" element={<OperationsLogin />} />
          <Route path="/operations/dashboard" element={<OperationsDashboard />} />
          <Route path="/operations/proposals" element={<OperationsProposals />} />
          <Route path="/operations/brochures" element={<OperationsBrochures />} />
          <Route path="/operations/inwards" element={<OperationsInwards />} />
          <Route path="/operations/outwards" element={<OperationsOutwards />} />
          <Route path="/operations/presentations" element={<OperationsPresentations />} />
          <Route path="/operations/media" element={<OperationsMedia />} />
          <Route path="/operations/gr" element={<OperationsGR />} />
          <Route path="/operations/settings" element={<OperationsSettings />} />
          <Route path="/operations/director-tasks" element={<OperationsDirectorTasks />} />
          
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
