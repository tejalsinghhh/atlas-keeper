import { useState } from "react";
import { Zap, MapPin, Users, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Simulate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const { toast } = useToast();

  const SAMPLE_TRIPS = [
    {
      origin: "Home",
      destination: "Office",
      mode: "CAR",
      companions: { adults: 0, children: 0, unknown: 0 }
    },
    {
      origin: "Office",
      destination: "Grocery Store",
      mode: "WALK",
      companions: { adults: 1, children: 0, unknown: 0 }
    },
    {
      origin: "Grocery Store",
      destination: "Home",
      mode: "BUS",
      companions: { adults: 1, children: 2, unknown: 0 }
    },
    {
      origin: "Home",
      destination: "Gym",
      mode: "BIKE",
      companions: { adults: 0, children: 0, unknown: 0 }
    },
    {
      origin: "Gym",
      destination: "Cafe",
      mode: "WALK",
      companions: { adults: 2, children: 0, unknown: 0 }
    },
    {
      origin: "Cafe",
      destination: "Park",
      mode: "WALK",
      companions: { adults: 2, children: 3, unknown: 0 }
    },
    {
      origin: "Park",
      destination: "Home",
      mode: "TRAIN",
      companions: { adults: 2, children: 3, unknown: 0 }
    }
  ];

  const generateRandomTrips = async () => {
    setIsGenerating(true);
    
    try {
      // Get or create user ID
      const consent = localStorage.getItem('natpac_consent');
      let userId = consent ? JSON.parse(consent).userId : null;

      if (!userId) {
        // Create demo user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            name: 'Demo User',
            email: `demo-${Math.random().toString(36).substring(7)}@example.com`
          }])
          .select()
          .single();

        if (userError) throw userError;
        userId = userData.id;

        // Update consent
        localStorage.setItem('natpac_consent', JSON.stringify({
          backgroundTracking: true,
          preciseCoordinates: false,
          shareWithNATPAC: true,
          userId,
          timestamp: new Date().toISOString()
        }));
      }

      // Generate 5 random trips
      const companionsForTrip: { adults: number; children: number; unknown: number; }[] = [];
      const tripsPayload = SAMPLE_TRIPS
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map((trip, index) => {
          const now = new Date();
          const startTime = new Date(now.getTime() - (index * 2 * 60 * 60 * 1000)); // 2 hours apart
          const endTime = new Date(startTime.getTime() + (30 + Math.random() * 60) * 60 * 1000); // 30-90 min duration

          companionsForTrip.push(trip.companions);

          return {
            origin: trip.origin,
            destination: trip.destination,
            mode: trip.mode,
            user_id: userId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          };
        });

      // Insert trips
      const { data: insertedTrips, error: tripsError } = await supabase
        .from('trips')
        .insert(tripsPayload)
        .select();

      if (tripsError) throw tripsError;

      // Add companions for trips that have them
      const companionInserts = [];
      insertedTrips?.forEach((trip, index) => {
        const companions = companionsForTrip[index];

        // Add adults
        for (let i = 0; i < companions.adults; i++) {
          companionInserts.push({
            trip_id: trip.id,
            name: `Adult Companion ${i + 1}`,
            relation: 'Adult',
            age: 25 + Math.floor(Math.random() * 40)
          });
        }

        // Add children
        for (let i = 0; i < companions.children; i++) {
          companionInserts.push({
            trip_id: trip.id,
            name: `Child ${i + 1}`,
            relation: 'Child',
            age: 5 + Math.floor(Math.random() * 10)
          });
        }

        // Add unknown companions
        for (let i = 0; i < companions.unknown; i++) {
          companionInserts.push({
            trip_id: trip.id,
            name: `Companion ${i + 1}`,
            relation: 'Unknown',
            age: null
          });
        }
      });

      if (companionInserts.length > 0) {
        const { error: companionsError } = await supabase
          .from('travellers')
          .insert(companionInserts);

        if (companionsError) throw companionsError;
      }

      setLastGenerated({
        count: insertedTrips?.length || 0,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Demo Trips Generated!",
        description: `Successfully created ${insertedTrips?.length || 0} sample trips with companions.`,
      });

    } catch (error) {
      console.error('Error generating trips:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate demo trips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-display font-bold">Trip Simulator</h1>
        <p className="text-muted-foreground">
          Generate sample trip data for testing and demonstration
        </p>
      </div>

      {/* Main Action Card */}
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Generate Demo Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Create 5 realistic trips with various transport modes and companions
            </p>
          </div>

          <Button 
            onClick={generateRandomTrips}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate 5 Trips
              </>
            )}
          </Button>

          {lastGenerated && (
            <div className="p-3 bg-accent/10 rounded-card border border-accent/20">
              <p className="text-sm text-accent text-center">
                ✓ Generated {lastGenerated.count} trips at{' '}
                {new Date(lastGenerated.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Gets Generated */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Realistic Routes</p>
              <p className="text-sm text-muted-foreground">Home, Office, Store, etc.</p>
            </div>
            <div className="text-center">
              <Badge className="mode-car w-8 h-8 mb-2 flex items-center justify-center">
                <span className="text-xs">🚗</span>
              </Badge>
              <p className="font-medium">Transport Modes</p>
              <p className="text-sm text-muted-foreground">Walk, Car, Bus, Train, Bike</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="font-medium">Companions</p>
              <p className="text-sm text-muted-foreground">Adults, children, family</p>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="font-medium">Realistic Times</p>
              <p className="text-sm text-muted-foreground">30-90 min trips</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Sample Routes</h4>
            <div className="grid gap-2">
              {SAMPLE_TRIPS.slice(0, 3).map((trip, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <span>{trip.origin} → {trip.destination}</span>
                  <Badge className={`mode-${trip.mode.toLowerCase()}`}>
                    {trip.mode}
                  </Badge>
                </div>
              ))}
              <div className="text-center text-sm text-muted-foreground py-2">
                ... and 4 more varied routes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-card">
            <p className="text-sm">
              <strong>Purpose:</strong> This tool generates realistic sample data to demonstrate 
              the trip tracking, companion capture, and dashboard analytics features.
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-card">
            <p className="text-sm text-muted-foreground">
              <strong>Data Generated:</strong> Trips with origins, destinations, modes, timing, 
              and associated companion records. All data uses the same Supabase backend as 
              the live tracking features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}