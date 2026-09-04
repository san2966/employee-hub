import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Smartphone, Tablet, Laptop, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDeviceHistory, getCurrentAccountKey, type DeviceHistoryRecord } from "@/lib/deviceHistory";
import { formatDateTime } from "@/lib/dateFormat";

const typeIcon = (type: string) => {
  switch (type) {
    case "phone":
      return <Smartphone className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    case "laptop":
      return <Laptop className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

const DeviceHistoryCard = ({ accountKey }: { accountKey?: string }) => {
  const [rows, setRows] = useState<DeviceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const key = accountKey || getCurrentAccountKey();
    setRows(await fetchDeviceHistory(key));
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountKey]);

  return (
    <Card className="card-corporate">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Device History</CardTitle>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Device Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">IP Address</th>
                <th className="text-left p-3 font-medium">Login Time</th>
                <th className="text-left p-3 font-medium">Browser / Application</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No login records yet</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="p-3">{r.device_name || "-"}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        {typeIcon(r.device_type)}{r.device_type}
                      </span>
                    </td>
                    <td className="p-3">{r.ip_address || "-"}</td>
                    <td className="p-3 whitespace-nowrap">{formatDateTime(r.login_time)}</td>
                    <td className="p-3">{r.is_application ? "Application" : r.browser || "-"}</td>
                    <td className="p-3">
                      {r.status === "successful" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">
                          <ShieldCheck className="h-3 w-3" />Successful
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive">
                          <ShieldAlert className="h-3 w-3" />Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Showing the latest 10 login records. Older records are cleared automatically on the next login.</p>
      </CardContent>
    </Card>
  );
};

export default DeviceHistoryCard;
