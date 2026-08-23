import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmulators, getAgents } from '@/lib/agent.functions';
import { requestDiagnosticScreenshot, requestVisionTest } from '@/lib/agent-communication.functions';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Camera, Search, CheckCircle2, XCircle } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/vision-test')({
  component: VisionTestPage,
});

function VisionTestPage() {
  const queryClient = useQueryClient();
  const [selectedEmulator, setSelectedEmulator] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);

  const { data: emulators } = useQuery({
    queryKey: ['admin', 'emulators'],
    queryFn: () => getEmulators({}),
  });

  const { data: rules } = useQuery({
    queryKey: ['admin', 'vision_rules'],
    queryFn: async () => {
      const { data } = await supabase.from('vision_rules').select('*, vision_assets(name)');
      return data;
    },
  });

  const screenshotMutation = useMutation({
    mutationFn: requestDiagnosticScreenshot,
    onSuccess: (data: any) => {
      setActiveCommandId(data.id);
      setIsPolling(true);
      toast.info('Screenshot command sent to agent...');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const visionTestMutation = useMutation({
    mutationFn: requestVisionTest,
    onSuccess: (data: any) => {
      setActiveCommandId(data.id);
      setIsPolling(true);
      toast.info('Vision test command sent to agent...');
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Poll for command completion
  useEffect(() => {
    let interval: any;
    if (isPolling && activeCommandId) {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('agent_commands')
          .select('*')
          .eq('id', activeCommandId)
          .single();

        if (error) {
          setIsPolling(false);
          return;
        }

        if (data.status === 'SUCCESS') {
          setIsPolling(false);
          setActiveCommandId(null);
          toast.success('Agent responded successfully');
          
          if (data.payload?.screenshot) {
            setScreenshot(`data:image/png;base64,${data.payload.screenshot}`);
          }
          
          if (data.command_type === 'TEST_VISION_RULE') {
            setVisionResult(data.payload);
          }
        } else if (data.status === 'FAILED') {
          setIsPolling(false);
          setActiveCommandId(null);
          toast.error(`Command failed: ${data.error_message || 'Unknown error'}`);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPolling, activeCommandId]);

  const handleScreenshot = () => {
    if (!selectedEmulator) return;
    setVisionResult(null);
    screenshotMutation.mutate({ 
      agentId: selectedEmulator.agent_id, 
      deviceId: selectedEmulator.devices?.device_id 
    });
  };

  const handleVisionTest = () => {
    if (!selectedEmulator || !selectedRule) return;
    visionTestMutation.mutate({
      agentId: selectedEmulator.agent_id,
      deviceId: selectedEmulator.devices?.device_id,
      ruleId: selectedRule
    });
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vision Diagnostic Tool</h1>
        <p className="text-muted-foreground">Test screenshot capture and vision rules on active emulators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Control Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Emulator</label>
              <Select onValueChange={(val) => setSelectedEmulator(emulators?.find(e => e.id === val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an emulator" />
                </SelectTrigger>
                <SelectContent>
                  {emulators?.map((emu: any) => (
                    <SelectItem key={emu.id} value={emu.id}>
                      {emu.name} ({emu.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vision Rule</label>
              <Select onValueChange={setSelectedRule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vision rule" />
                </SelectTrigger>
                <SelectContent>
                  {rules?.map((rule: any) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name} ({rule.vision_assets?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                className="w-full" 
                onClick={handleScreenshot}
                disabled={!selectedEmulator || isPolling}
              >
                {isPolling && screenshotMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                Capture Screenshot
              </Button>
              <Button 
                variant="secondary"
                className="w-full" 
                onClick={handleVisionTest}
                disabled={!selectedEmulator || !selectedRule || isPolling}
              >
                {isPolling && visionTestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Run Vision Rule
              </Button>
            </div>

            {visionResult && (
              <div className="mt-6 p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  {visionResult.detected ? (
                    <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Detected</Badge>
                  ) : (
                    <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Not Found</Badge>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Confidence:</span>
                  <span className="font-mono">{(visionResult.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Matches:</span>
                  <span className="font-mono">{visionResult.matches?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time:</span>
                  <span className="font-mono">{visionResult.processingTimeMs}ms</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 min-h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Live Preview (1012x800)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center bg-black/5 rounded-b-lg relative overflow-hidden">
            {screenshot ? (
              <div className="relative">
                <img 
                  src={screenshot} 
                  alt="Emulator Screenshot" 
                  className="max-w-full h-auto border shadow-2xl"
                  style={{ width: '1012px', height: '800px', objectFit: 'contain' }}
                />
                {visionResult?.matches?.map((match: any, i: number) => (
                  <div 
                    key={i}
                    className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                    style={{
                      left: `${(match.x / 1012) * 100}%`,
                      top: `${(match.y / 800) * 100}%`,
                      width: `${(match.width / 1012) * 100}%`,
                      height: `${(match.height / 800) * 100}%`
                    }}
                  >
                    <span className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1 rounded">
                      #{(match.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center">
                <Camera className="w-12 h-12 mb-2 opacity-20" />
                <p>No screenshot captured yet</p>
              </div>
            )}
            
            {isPolling && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-sm font-medium">Waiting for Agent...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}