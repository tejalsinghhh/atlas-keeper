import { useState, useEffect } from "react";
import { BarChart3, Download, Users, MapPin, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalTrips: 0,
    uniqueUsers: 0,
    modeShare: {},
    odMatrix: [],
    recentTrips: []
  });
  const [dateRange, setDateRange] = useState("7d");
  const [selectedMode, setSelectedMode] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const TRANSPORT_MODES = [
    { value: "WALK", label: "Walk", color: "bg-green-500" },
    { value: "BIKE", label: "Bike", color: "bg-yellow-500" },
    { value: "CAR", label: "Car", color: "bg-red-500" },
    { value: "BUS", label: "Bus", color: "bg-blue-500" },
    { value: "TRAIN", label: "Train", color: "bg-purple-500" },
    { value: "OTHER", label: "Other", color: "bg-gray-500" },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, selectedMode]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date filter
      const endDate = new Date();
      const startDate = new Date();
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Load trips data
      let tripsQuery = supabase
        .from('trips')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (selectedMode !== "all") {
        tripsQuery = tripsQuery.eq('mode', selectedMode);
      }

      const { data: trips, error: tripsError } = await tripsQuery;
      if (tripsError) throw tripsError;

      // Load users data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');
      if (usersError) throw usersError;

      // Calculate mode share
      const modeShare = {};
      trips?.forEach(trip => {
        const mode = trip.mode || 'OTHER';
        modeShare[mode] = (modeShare[mode] || 0) + 1;
      });

      // Calculate OD Matrix (simplified)
      const odMatrix = {};
      trips?.forEach(trip => {
        const od = `${trip.origin} → ${trip.destination}`;
        odMatrix[od] = (odMatrix[od] || 0) + 1;
      });

      const odMatrixArray = Object.entries(odMatrix)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => Number(b.count) - Number(a.count))
        .slice(0, 10);

      setDashboardData({
        totalTrips: trips?.length || 0,
        uniqueUsers: users?.length || 0,
        modeShare,
        odMatrix: odMatrixArray,
        recentTrips: trips?.slice(0, 5) || []
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*');

      if (error) throw error;

      // Convert to CSV format
      const csvContent = [
        // Header row
        ['id', 'origin', 'destination', 'start_time', 'end_time', 'mode', 'user_id', 'trip_number'].join(','),
        // Data rows
        ...(data || []).map(trip => [
          trip.id,
          `"${trip.origin}"`,
          `"${trip.destination}"`,
          trip.start_time,
          trip.end_time || '',
          trip.mode || '',
          trip.user_id || '',
          trip.trip_number
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `natpac-trips-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Trip data has been exported to CSV.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getModeSharePercentage = (mode: string, count: number): string => {
    const modeShareValues = Object.values(dashboardData.modeShare);
    const total = modeShareValues.reduce((sum: number, c: unknown) => {
      return sum + (typeof c === 'number' ? c : Number(c) || 0);
    }, 0);
    
    if (total === 0) return "0";
    return ((count / Number(total)) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse"></div>
          <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-card animate-pulse"></div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-card animate-pulse"></div>
            <div className="h-64 bg-muted rounded-card animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-display font-bold">Scientist Dashboard</h1>
          <p className="text-muted-foreground">
            Travel pattern analysis and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{dashboardData.totalTrips}</p>
                <p className="text-sm text-muted-foreground">Total Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <div>
                <p className="text-2xl font-bold">{dashboardData.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-warning" />
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(dashboardData.modeShare).length}
                </p>
                <p className="text-sm text-muted-foreground">Transport Modes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(dashboardData.totalTrips / 7)}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Daily Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mode Share */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Mode Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboardData.modeShare).map(([mode, count]) => {
                const modeInfo = TRANSPORT_MODES.find(m => m.value === mode);
                const percentage = getModeSharePercentage(mode, Number(count));
                
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${modeInfo?.color || 'bg-gray-500'}`}></div>
                        <span className="text-sm font-medium">{modeInfo?.label || mode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{String(count)}</span>
                        <Badge variant="secondary">{percentage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${modeInfo?.color || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.keys(dashboardData.modeShare).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No trips recorded yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* OD Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Popular Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.odMatrix.map((route, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{route.route}</p>
                  </div>
                  <Badge variant="secondary">
                    {route.count} trips
                  </Badge>
                </div>
              ))}
            </div>
            
            {dashboardData.odMatrix.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No route data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trip Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.recentTrips.map((trip, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Badge className={`mode-${trip.mode?.toLowerCase() || 'other'}`}>
                    {trip.mode || 'Unknown'}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.start_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {dashboardData.recentTrips.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No recent trips
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}