import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateMissionFromDescription } from '@/lib/ai-mission-builder.functions';
import { upsertMissionStep } from '@/lib/mission.functions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AiMissionBuilderProps {
  missionId: string;
  templateId: string;
}

export function AiMissionBuilder({ missionId, templateId }: AiMissionBuilderProps) {
  const [description, setDescription] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: (desc: string) => generateMissionFromDescription({ data: { description: desc } }),
    onSuccess: (data) => {
      setGeneratedResult(data);
      toast.success('Generated mission draft successfully');
    },
    onError: (error: any) => {
      toast.error(`Generation failed: ${error.message}`);
    }
  });

  const saveStepsMutation = useMutation({
    mutationFn: async (steps: any[]) => {
      for (const step of steps) {
        await upsertMissionStep({
          data: {
            mission_template_id: templateId,
            name: step.name || `AI Step ${step.order}`,
            step_type: step.action,
            step_order: step.order,
            configuration: step.parameters || {},
            timeout_ms: step.timeout || 5000,
            retry_count: step.retries || 3,
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      setGeneratedResult(null);
      setDescription('');
      toast.success('Mission steps saved and ready for review');
    },
    onError: (error: any) => {
      toast.error(`Failed to save steps: ${error.message}`);
    }
  });

  const handleGenerate = () => {
    if (!description.trim()) return;
    generateMutation.mutate(description);
  };

  const handleSave = () => {
    if (!generatedResult?.steps) return;
    saveStepsMutation.mutate(generatedResult.steps);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Mission Builder
          </CardTitle>
          <CardDescription>
            Describe your mission in plain language, and the AI will generate the structured steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., Find the 'Wheat' icon and click it. Wait 2 seconds, then click the 'Confirm' button. If a popup appears, close it first."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
            disabled={generateMutation.isPending}
          />
          <Button 
            onClick={handleGenerate} 
            disabled={generateMutation.isPending || !description.trim()}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Mission Steps
          </Button>
        </CardContent>
      </Card>

      {generatedResult && (
        <Card border-primary>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Preview: {generatedResult.name}</CardTitle>
              <CardDescription>Review the generated steps before applying them to your mission draft.</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saveStepsMutation.isPending}>
              {saveStepsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Apply to Mission Draft
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedResult.steps.map((step: any, idx: number) => (
              <Alert key={idx} variant={step.status === 'REQUIRES_ASSET' ? 'destructive' : 'default'}>
                {step.status === 'REQUIRES_ASSET' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle className="flex items-center justify-between">
                  <span>Step {step.order}: {step.name || step.action}</span>
                  <Badge variant="outline">{step.action}</Badge>
                </AlertTitle>
                <AlertDescription className="mt-2 text-sm">
                  <div className="flex flex-col gap-1">
                    <div><strong>Parameters:</strong> {JSON.stringify(step.parameters)}</div>
                    {step.status === 'REQUIRES_ASSET' && (
                      <div className="text-destructive font-bold">
                        Warning: Missing Vision Asset "{step.asset_name}". You must resolve this manually after applying.
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
