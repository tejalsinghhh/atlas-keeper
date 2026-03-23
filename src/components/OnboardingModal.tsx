import { useState, useEffect } from "react";
import { Shield, MapPin, Clock, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [backgroundTracking, setBackgroundTracking] = useState(true);
  const [preciseCoordinates, setPreciseCoordinates] = useState(false);
  const [shareWithNATPAC, setShareWithNATPAC] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConsent = async () => {
    if (!shareWithNATPAC) {
      toast({
        title: "Consent Required",
        description: "Sharing with NATPAC is required to use this app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create anonymous user session first
      const { data: session } = await supabase.auth.getSession();
      let userId = session.session?.user.id;

      if (!userId) {
        // Create a demo user if not authenticated
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([
            {
              name: 'Demo User',
              email: `demo-${Math.random().toString(36).substring(7)}@example.com`
            }
          ])
          .select()
          .single();

        if (userError) throw userError;
        userId = userData.id;
      }

      // Store consent
      const { error } = await supabase
        .from('consent')
        .insert([
          {
            user_id: userId,
            consent_given: true,
            consent_date: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      // Store consent preferences in localStorage
      localStorage.setItem('natpac_consent', JSON.stringify({
        backgroundTracking,
        preciseCoordinates,
        shareWithNATPAC,
        userId,
        timestamp: new Date().toISOString()
      }));

      toast({
        title: "Welcome to NATPAC!",
        description: "Your consent has been recorded. Let's start tracking your trips.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error storing consent:', error);
      toast({
        title: "Error",
        description: "Failed to store consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-heading">
            <Shield className="w-5 h-5 text-primary" />
            Help us plan better transport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* What we collect */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">What we collect:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Trip locations, times, and transport modes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                <span>Number and type of travel companions</span>
              </div>
            </div>
          </div>

          {/* Why and retention */}
          <div className="p-3 bg-muted/50 rounded-card">
            <p className="text-sm text-muted-foreground">
              <strong>Purpose:</strong> To understand travel patterns and improve transport planning.<br />
              <strong>Retention:</strong> Data stored for 1 year, then anonymized.<br />
              <strong>Deletion:</strong> Contact support to delete your data anytime.
            </p>
          </div>

          {/* Consent toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="background" className="text-sm">
                Allow background tracking
              </Label>
              <Switch
                id="background"
                checked={backgroundTracking}
                onCheckedChange={setBackgroundTracking}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="precise" className="text-sm">
                Allow precise coordinates
              </Label>
              <Switch
                id="precise"
                checked={preciseCoordinates}
                onCheckedChange={setPreciseCoordinates}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="share" className="text-sm font-medium">
                Share with NATPAC (Required)
              </Label>
              <Switch
                id="share"
                checked={shareWithNATPAC}
                onCheckedChange={setShareWithNATPAC}
              />
            </div>
          </div>

          {/* Consent button */}
          <Button 
            onClick={handleConsent}
            disabled={!shareWithNATPAC || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Processing..." : "I consent"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Consent version 1.0
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}