import OperationsLayout from "@/components/operations/OperationsLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const OperationsDirectorTasks = () => (
  <OperationsLayout title="Director Tasks">
    <Card>
      <CardHeader><CardTitle>Tasks from Director</CardTitle></CardHeader>
      <CardContent><DirectorTasksTab department="Operations" /></CardContent>
    </Card>
  </OperationsLayout>
);

export default OperationsDirectorTasks;
