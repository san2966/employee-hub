import AccountsLayout from "@/components/accounts/AccountsLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const AccountsDirectorTasks = () => (
  <AccountsLayout title="Director Tasks">
    <Card>
      <CardHeader><CardTitle>Tasks from Director</CardTitle></CardHeader>
      <CardContent><DirectorTasksTab department="Accounts" /></CardContent>
    </Card>
  </AccountsLayout>
);

export default AccountsDirectorTasks;
