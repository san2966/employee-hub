import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const ITHeadDirectorTasks = () => (
  <ITHeadLayout title="Director Tasks">
    <Card>
      <CardHeader><CardTitle>Tasks from Director</CardTitle></CardHeader>
      <CardContent><DirectorTasksTab department="IT" /></CardContent>
    </Card>
  </ITHeadLayout>
);

export default ITHeadDirectorTasks;
