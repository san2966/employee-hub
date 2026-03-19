import HRLayout from "@/components/hr/HRLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const HRDirectorTasks = () => (
  <HRLayout title="Director Tasks">
    <Card>
      <CardHeader><CardTitle>Tasks from Director</CardTitle></CardHeader>
      <CardContent><DirectorTasksTab department="HR" /></CardContent>
    </Card>
  </HRLayout>
);

export default HRDirectorTasks;
