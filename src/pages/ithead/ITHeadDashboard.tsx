import { useState, useEffect } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { useITHeadData } from "@/hooks/useITHeadData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  StickyNote, 
  Shield, 
  Wifi, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  Check,
  Search
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ITHeadDashboard = () => {
  const { assets, notes, addNote, updateNote, deleteNote } = useITHeadData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Simulated internet speed data (updates every 5 seconds)
  const [speedData, setSpeedData] = useState<{ time: string; speed: number }[]>([]);

  // Simulated usage data
  const usageData = [
    { day: "Mon", users: 45 },
    { day: "Tue", users: 52 },
    { day: "Wed", users: 48 },
    { day: "Thu", users: 61 },
    { day: "Fri", users: 55 },
    { day: "Sat", users: 22 },
    { day: "Sun", users: 18 },
  ];

  // Generate simulated speed data
  useEffect(() => {
    const generateSpeedData = () => {
      const now = new Date();
      const newPoint = {
        time: format(now, "HH:mm"),
        speed: Math.floor(Math.random() * 50) + 50 // 50-100 Mbps
      };
      setSpeedData(prev => {
        const updated = [...prev, newPoint];
        return updated.slice(-12); // Keep last 12 data points
      });
    };

    // Initial data
    for (let i = 11; i >= 0; i--) {
      const time = new Date(Date.now() - i * 5000);
      speedData.push({
        time: format(time, "HH:mm:ss"),
        speed: Math.floor(Math.random() * 50) + 50
      });
    }
    setSpeedData([...speedData]);

    // Update every 5 seconds
    const interval = setInterval(generateSpeedData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get warranty data from assets
  const warrantyData = assets
    .filter(asset => asset.warrantyTill)
    .map(asset => ({
      serialNumber: asset.serialNumber,
      warrantyTill: asset.warrantyTill,
      brand: asset.brand,
      model: asset.model
    }))
    .sort((a, b) => new Date(a.warrantyTill).getTime() - new Date(b.warrantyTill).getTime());

  const filteredWarranty = warrantyData.filter(item =>
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addNote(newNoteContent.trim());
      setNewNoteContent("");
      setIsAddNoteOpen(false);
    }
  };

  const handleEditNote = (id: string, content: string) => {
    setEditingNote(id);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (editingNote && editContent.trim()) {
      updateNote(editingNote, editContent.trim());
      setEditingNote(null);
      setEditContent("");
    }
  };

  const recentNote = notes[0];
  const olderNotes = notes.slice(1);

  return (
    <ITHeadLayout title="Dashboard">
      <div className="space-y-6">
        {/* Top Row - Notes and Warranty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-5 w-5 text-primary" />
                Notes
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddNoteOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recent Note - Highlighted */}
              {recentNote ? (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    {editingNote === recentNote.id ? (
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{recentNote.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(recentNote.createdAt), "PPp")}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditNote(recentNote.id, recentNote.content)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteNote(recentNote.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes yet. Add your first note!
                </p>
              )}

              {/* Older Notes - Scrollable */}
              {olderNotes.length > 0 && (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {olderNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {editingNote === note.id ? (
                            <div className="flex-1 space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-sm text-foreground line-clamp-2">{note.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(note.createdAt), "PP")}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditNote(note.id, note.content)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => deleteNote(note.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Warranty Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" />
                Asset Warranty Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by serial number or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <ScrollArea className="h-[280px]">
                {filteredWarranty.length > 0 ? (
                  <div className="space-y-2">
                    {filteredWarranty.map((item, index) => {
                      const warrantyDate = new Date(item.warrantyTill);
                      const isExpired = warrantyDate < new Date();
                      const isExpiringSoon = !isExpired && warrantyDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            isExpired ? "border-destructive/50 bg-destructive/5" :
                            isExpiringSoon ? "border-warning/50 bg-warning/5" :
                            "border-border bg-muted/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{item.brand} {item.model}</p>
                              <p className="text-xs text-muted-foreground">SN: {item.serialNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                isExpired ? "text-destructive" :
                                isExpiringSoon ? "text-warning" :
                                "text-foreground"
                              }`}>
                                {format(warrantyDate, "PP")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchTerm ? "No matching assets found" : "No assets with warranty data"}
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Internet Speed Graph */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-5 w-5 text-primary" />
                Internet Speed (Live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speedData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      domain={[0, 120]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      label={{ value: 'Mbps', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="speed" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Usage Graph */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Daily Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      label={{ value: 'Users', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar 
                      dataKey="users" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter your note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ITHeadLayout>
  );
};

export default ITHeadDashboard;
