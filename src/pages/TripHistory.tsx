import { useState, useEffect } from "react";
import { Calendar, Filter, Search, MapPin, Clock, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TripCard } from "@/components/TripCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const TRANSPORT_MODES = [
    { value: "all", label: "All Modes" },
    { value: "WALK", label: "Walk", color: "mode-walk" },
    { value: "BIKE", label: "Bike", color: "mode-bike" },
    { value: "CAR", label: "Car", color: "mode-car" },
    { value: "BUS", label: "Bus", color: "mode-bus" },
    { value: "TRAIN", label: "Train", color: "mode-train" },
    { value: "OTHER", label: "Other", color: "mode-other" },
  ];

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchTerm, selectedMode]);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      
      // Get user ID from consent or use demo data
      const consent = localStorage.getItem('natpac_consent');
      let userId = consent ? JSON.parse(consent).userId : null;

      let query = supabase
        .from('trips')
        .select('*')
        .order('start_time', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast({
        title: "Error",
        description: "Failed to load trip history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTrips = () => {
    let filtered = trips;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by mode
    if (selectedMode !== "all") {
      filtered = filtered.filter(trip => trip.mode === selectedMode);
    }

    setFilteredTrips(filtered);
  };

  const handleTripUpdate = (updatedTrip) => {
    setTrips(current =>
      current.map(trip =>
        trip.id === updatedTrip.id ? updatedTrip : trip
      )
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTripStats = () => {
    const totalTrips = trips.length;
    const modes = trips.reduce((acc, trip) => {
      acc[trip.mode] = (acc[trip.mode] || 0) + 1;
      return acc;
    }, {});
    
    const mostUsedMode = Object.entries(modes).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    
    return {
      totalTrips,
      mostUsedMode: mostUsedMode ? mostUsedMode[0] : 'N/A'
    };
  };

  const stats = getTripStats();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse"></div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-card animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-card animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-display font-bold">Trip History</h1>
          <p className="text-muted-foreground">
            View and manage your recorded journeys
          </p>
        </div>
        <Button variant="outline" onClick={loadTrips}>
          <Calendar className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTrips}</p>
                <p className="text-sm text-muted-foreground">Total Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.totalTrips * 2.3)}</p>
                <p className="text-sm text-muted-foreground">Hours Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge className={`mode-${stats.mostUsedMode?.toLowerCase() || 'other'}`}>
                {stats.mostUsedMode}
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Most Used Mode</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search origin or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TRANSPORT_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={selectedMode === mode.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMode(mode.value)}
              className={selectedMode === mode.value && mode.color ? mode.color : ""}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Trip List */}
      {filteredTrips.length > 0 ? (
        <div className="space-y-3">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSave={handleTripUpdate}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-subheading mb-2">
              {trips.length === 0 ? "No Trips Yet" : "No Matching Trips"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {trips.length === 0
                ? "Start tracking to see your journey history here."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {trips.length === 0 && (
              <Button variant="outline" onClick={() => window.history.back()}>
                Start Tracking
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}