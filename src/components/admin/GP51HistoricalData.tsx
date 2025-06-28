
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51Position } from '@/types/gp51-unified';

interface GP51HistoricalDataProps {
  deviceId?: string;
}

const GP51HistoricalData: React.FC<GP51HistoricalDataProps> = ({ deviceId }) => {
  const [startTime, setStartTime] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endTime, setEndTime] = useState<Date | undefined>(new Date());
  const [historicalData, setHistoricalData] = useState<GP51Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deviceId) {
      fetchHistoricalData(deviceId);
    }
  }, [deviceId, startTime, endTime]);

  const fetchHistoricalData = async (deviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fixed: Added proper parameters for getHistoryTracks
      const result = await gp51DataService.getHistoryTracks(
        deviceId, 
        startTime, 
        endTime
      );
      setHistoricalData(result);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Failed to fetch historical data');
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Data</CardTitle>
        <CardDescription>View historical tracking data for a specific device.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !startTime && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startTime ? (
                  format(startTime, "PPP")
                ) : (
                  <span>Pick a start date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startTime}
                onSelect={setStartTime}
                disabled={(date) =>
                  date > (endTime || new Date())
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !endTime && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endTime ? (
                  format(endTime, "PPP")
                ) : (
                  <span>Pick an end date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endTime}
                onSelect={setEndTime}
                disabled={(date) =>
                  date < (startTime || new Date())
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        {loading ? (
          <div>Loading historical data...</div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Found {historicalData.length} historical records
            </div>
            <div className="max-h-96 overflow-y-auto">
              {historicalData.map((item, index) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <div>Device: {item.deviceid}</div>
                  <div>Location: {item.callat?.toFixed(6)}, {item.callon?.toFixed(6)}</div>
                  <div>Speed: {item.speed || 0} km/h</div>
                  <div>Time: {item.servertime ? new Date(item.servertime).toLocaleString() : 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51HistoricalData;
