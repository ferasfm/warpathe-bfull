import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMissionDetails, upsertMissionStep, deleteMissionStep, publishTemplate } from '@/lib/mission.functions';
import { getMissionRunsForMission } from '@/lib/monitoring.functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ArrowUp, ArrowDown, CheckCircle2, Sparkles, ExternalLink, Clock, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AiMissionBuilder } from '@/components/admin/AiMissionBuilder';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/admin/missions/$id')({
  component: MissionBuilderPage,
});

const STEP_TYPES = [
  'DETECT_IMAGE',
  'TAP_TARGET',
  'WAIT',
  'SWIPE',
  'VERIFY',
  'SELECT_RESOURCE',
  'SELECT_FLEET',
  'SEND_FLEET',
  'RECOVERY',
  'COMPLETE',
];

function MissionBuilderPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: mission, isLoading } = useQuery({
    queryKey: ['mission', id],
    queryFn: () => getMissionDetails({ data: { id } }),
  });

  const upsertStepMutation = useMutation({
    mutationFn: upsertMissionStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      toast.success('تم حفظ الخطوة');
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: deleteMissionStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      toast.success('تم حذف الخطوة');
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      toast.success('تم نشر هذا الإصدار بنجاح');
    },
  });

  if (isLoading) return <div className="p-8 text-center">جاري تحميل المهمة...</div>;
  if (!mission) return <div className="p-8 text-center">المهمة غير موجودة</div>;

  const activeTemplate = mission.mission_templates?.find(t => t.status === 'published') || mission.mission_templates?.[0];
  const sortedSteps = [...(activeTemplate?.mission_steps || [])].sort((a, b) => a.step_order - b.step_order);

  const handleAddStep = () => {
    if (!activeTemplate) return;
    upsertStepMutation.mutate({
      data: {
        mission_template_id: activeTemplate.id,
        name: `الخطوة الجديدة ${sortedSteps.length + 1}`,
        step_type: 'WAIT',
        step_order: sortedSteps.length + 1,
        configuration: {},
        timeout_ms: 5000,
        retry_count: 3
      }
    });
  };

  const handleMoveStep = (step: any, direction: 'up' | 'down') => {
    const index = sortedSteps.findIndex(s => s.id === step.id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sortedSteps.length - 1) return;

    const otherStep = sortedSteps[direction === 'up' ? index - 1 : index + 1];
    
    // Swap orders
    upsertStepMutation.mutate({
      data: { 
        ...step, 
        step_order: otherStep.step_order,
        timeout_ms: step.timeout_ms ?? undefined,
        retry_count: step.retry_count ?? undefined,
        configuration: step.configuration ?? undefined
      }
    });
    upsertStepMutation.mutate({
      data: { 
        ...otherStep, 
        step_order: step.step_order,
        timeout_ms: otherStep.timeout_ms ?? undefined,
        retry_count: otherStep.retry_count ?? undefined,
        configuration: otherStep.configuration ?? undefined
      }
    });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{mission.name}</h1>
          <p className="text-muted-foreground">{mission.description || 'لا يوجد وصف'}</p>
        </div>
        <div className="flex gap-2">
            <Badge variant={activeTemplate?.status === 'published' ? 'default' : 'secondary'}>
                إصدار {activeTemplate?.version} ({activeTemplate?.status})
            </Badge>
            {activeTemplate?.status !== 'published' && (
                <Button onClick={() => publishMutation.mutate({ data: { templateId: activeTemplate.id, missionId: mission.id } })}>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    نشر الإصدار
                </Button>
            )}
            <Button variant="outline" asChild>
                <Link to="/admin/missions">العودة للقائمة</Link>
            </Button>
        </div>
      </div>

      <Tabs defaultValue="builder">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="builder">بناء المهمة</TabsTrigger>
          <TabsTrigger value="ai-builder" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI Builder
          </TabsTrigger>
          <TabsTrigger value="history">سجل التنفيذ</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-builder" className="pt-4">
          <AiMissionBuilder missionId={mission.id} templateId={activeTemplate?.id || ''} />
        </TabsContent>

        <TabsContent value="builder" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>خطوات المهمة</CardTitle>
                <CardDescription>قم بتعريف وترتيب الخطوات التي يجب تنفيذها</CardDescription>
              </div>
              <Button onClick={handleAddStep}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة خطوة
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">الترتيب</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المهلة (ms)</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSteps.map((step, idx) => (
                    <TableRow key={step.id}>
                      <TableCell className="font-bold">{step.step_order}</TableCell>
                      <TableCell>{step.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{step.step_type}</Badge>
                      </TableCell>
                      <TableCell>{step.timeout_ms}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleMoveStep(step, 'up')}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleMoveStep(step, 'down')}
                          disabled={idx === sortedSteps.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if(confirm('حذف هذه الخطوة؟')) deleteStepMutation.mutate({ data: { id: step.id } });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedSteps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد خطوات حالياً. ابدأ بإضافة خطوة جديدة.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <MissionHistory missionId={mission.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MissionHistory({ missionId }: { missionId: string }) {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['mission-runs', missionId],
    queryFn: () => getMissionRunsForMission({ data: { missionId } }),
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التنفيذ التاريخي</CardTitle>
        <CardDescription>أحدث 50 عملية تشغيل لهذه المهمة عبر جميع المزارع</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>المزرعة</TableHead>
              <TableHead>المحاكي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التقدم</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs?.map((run: any) => (
              <TableRow key={run.id}>
                <TableCell className="text-xs">
                  {format(new Date(run.created_at), 'yyyy-MM-dd HH:mm')}
                </TableCell>
                <TableCell className="font-medium">{(run.farms as any)?.name}</TableCell>
                <TableCell className="text-xs">{(run.emulators as any)?.instance_name}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      run.status === 'COMPLETED' ? 'default' : 
                      run.status === 'FAILED' ? 'destructive' : 
                      'outline'
                    }
                    className={run.status === 'RUNNING' ? 'animate-pulse' : ''}
                  >
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${(run.current_step_index / (run.total_steps || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px]">{run.current_step_index}/{run.total_steps}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link 
                      to="/admin/missions/runs/$runId"
                      params={{ runId: run.id }}
                    >
                      <ExternalLink className="w-4 h-4 ml-1" />
                      التفاصيل
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!runs || runs.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  لا توجد سجلات تنفيذ حالياً
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
