import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, Megaphone, Send } from "lucide-react";
import { formatDate } from "@/lib/dateFormat";

const Notices = () => {
  const { toast } = useToast();
  const { employees, notices, addNotice } = useDirectorData();
  
  const [noticeType, setNoticeType] = useState<"notice" | "announcement">("notice");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedEmployees(checked ? employees.map(e => e.id) : []);
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, id]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(e => e !== id));
      setSelectAll(false);
    }
  };

  const handleSend = async () => {
    if (!title || !content) {
      toast({ title: "Error", description: "Please fill title and content", variant: "destructive" });
      return;
    }

    if (noticeType === "notice" && selectedEmployees.length === 0) {
      toast({ title: "Error", description: "Please select at least one recipient", variant: "destructive" });
      return;
    }

    const recipients = noticeType === "announcement" ? employees.map(e => e.id) : selectedEmployees;
    
    try {
      await addNotice({
        type: noticeType,
        title,
        content,
        recipients,
      });

      toast({ 
        title: "Success", 
        description: `${noticeType === "notice" ? "Notice" : "Announcement"} sent successfully` 
      });

      setTitle("");
      setContent("");
      setSelectedEmployees([]);
      setSelectAll(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Message not sent",
        variant: "destructive",
      });
    }
  };

  const previousNotices = notices.filter(n => n.type === "notice");
  const previousAnnouncements = notices.filter(n => n.type === "announcement");

  return (
    <DirectorLayout title="Notice / Announcements">
      <Tabs defaultValue="new" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="previous">Previous</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="card-corporate p-6">
            {/* Type Selection */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={noticeType === "notice" ? "default" : "outline"}
                onClick={() => setNoticeType("notice")}
                className={noticeType === "notice" ? "gradient-primary" : ""}
              >
                <Bell className="h-4 w-4 mr-2" /> Notice
              </Button>
              <Button
                variant={noticeType === "announcement" ? "default" : "outline"}
                onClick={() => setNoticeType("announcement")}
                className={noticeType === "announcement" ? "gradient-primary" : ""}
              >
                <Megaphone className="h-4 w-4 mr-2" /> Announcement
              </Button>
            </div>

            {/* Recipients for Notice */}
            {noticeType === "notice" && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <Label className="mb-3 block">Select Recipients</Label>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">Select All</Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full">No employees available</p>
                  ) : (
                    employees.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2">
                        <Checkbox
                          id={emp.id}
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={(checked) => handleSelectEmployee(emp.id, checked as boolean)}
                        />
                        <Label htmlFor={emp.id} className="text-sm cursor-pointer truncate">{emp.name}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {noticeType === "announcement" && (
              <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  <Megaphone className="h-4 w-4 inline mr-2" />
                  Announcements are shared with all employees automatically
                </p>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your message..."
                  rows={6}
                />
              </div>
              <Button onClick={handleSend} className="gradient-primary">
                <Send className="h-4 w-4 mr-2" /> Send
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="previous">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Previous Notices */}
            <div className="card-corporate p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Previous Notices</h3>
              </div>
              {previousNotices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No previous notices</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {previousNotices.map(notice => (
                    <div key={notice.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{notice.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notice.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                      <p className="text-xs text-primary mt-2">{notice.recipients.length} recipient(s)</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Announcements */}
            <div className="card-corporate p-6">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Previous Announcements</h3>
              </div>
              {previousAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No previous announcements</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {previousAnnouncements.map(notice => (
                    <div key={notice.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{notice.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notice.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DirectorLayout>
  );
};

export default Notices;
