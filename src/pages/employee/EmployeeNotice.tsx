import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Megaphone } from "lucide-react";

const EmployeeNotice = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  
  const { getNotices } = useEmployeeData(employeeId);
  const notices = getNotices();
  
  const noticeOnly = notices.filter(n => n.type === "notice");
  const announcements = notices.filter(n => n.type === "announcement");

  return (
    <EmployeeLayout title="Notice">
      <div className="space-y-6">
        <Tabs defaultValue="notices" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="notices" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notices ({noticeOnly.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements ({announcements.length})
            </TabsTrigger>
          </TabsList>

          {/* Notices */}
          <TabsContent value="notices">
            <Card className="card-corporate">
              <CardHeader>
                <CardTitle>Notices from Director</CardTitle>
              </CardHeader>
              <CardContent>
                {noticeOnly.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Notices</p>
                    <p className="text-sm mt-2">Notices addressed to you will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {noticeOnly.map(notice => (
                        <div key={notice.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{notice.title}</h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notice.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements */}
          <TabsContent value="announcements">
            <Card className="card-corporate">
              <CardHeader>
                <CardTitle>Organization Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Announcements</p>
                    <p className="text-sm mt-2">Organization-wide announcements will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {announcements.map(announcement => (
                        <div key={announcement.id} className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Megaphone className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold">{announcement.title}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{announcement.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeNotice;
