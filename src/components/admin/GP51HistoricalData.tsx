import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

import { useToast } from "@/hooks/use-toast"
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import type { GP51Device, GP51Group } from '@/types/gp51';

const GP51HistoricalData: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { devices, groups } = useUnifiedGP51Service();

  useEffect(() => {
    console.log('Devices:', devices);
    console.log('Groups:', groups);
  }, [devices, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Placeholder for historical data retrieval logic
      toast({
        title: "Data Retrieval Initiated",
        description: `Retrieving historical data for ${selectedDevice ? `device ${selectedDevice}` : `group ${selectedGroup}`} from ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}.`,
      });
    } catch (error) {
      toast({
        title: "Error Retrieving Data",
        description: "Failed to retrieve historical data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fix type conversions on lines 51, 52, 63, 64
  const deviceCount = devices ? devices.length : 0;
  const isActiveCount = devices ? devices.filter(d => d.is_active).length : 0;
  const groupCount = groups ? groups.length : 0;
  const isOnlineCount = devices ? devices.filter(d => d.status === 'active').length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Data Retrieval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) =>
                      date > new Date() || (startDate && date < startDate)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="device">Select Device</Label>
              <Select onValueChange={setSelectedDevice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices && devices.map((device) => (
                    <SelectItem key={device.deviceid} value={device.deviceid}>
                      {device.devicename} ({device.deviceid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="group">Select Group</Label>
              <Select onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups && groups.map((group) => (
                    <SelectItem key={group.groupid} value={group.groupid.toString()}>
                      {group.groupname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrieving Data...
              </>
            ) : (
              "Retrieve Historical Data"
            )}
          </Button>
        </form>

        <div className="border-t pt-4">
          <CardTitle>Summary</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Devices:</p>
              <p className="text-sm">{deviceCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Active Devices:</p>
              <p className="text-sm">{isActiveCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Groups:</p>
              <p className="text-sm">{groupCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Devices Online:</p>
              <p className="text-sm">{isOnlineCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51HistoricalData;
