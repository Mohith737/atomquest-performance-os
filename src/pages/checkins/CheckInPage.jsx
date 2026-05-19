import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { submitCheckin } from '@/api/checkins'
import { getGoals } from '@/api/goals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import GoalCard from '@/components/shared/GoalCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { fireGoalCompletionConfetti } from '@/lib/completionConfetti'

const checkinSchema = z.object({
  goal: z.string().min(1, 'Select an approved goal'),
  progress_value: z.number().min(0).max(100),
  notes: z.string().min(10, 'Notes must be at least 10 characters'),
})

function GoalSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-28 rounded" />
      <Skeleton className="h-10 rounded-md" />
    </div>
  )
}

export default function CheckInPage() {
  const queryClient = useQueryClient()
  const [updatedGoal, setUpdatedGoal] = useState(null)
  const form = useForm({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      goal: '',
      progress_value: 0,
      notes: '',
    },
  })
  const goalsQuery = useQuery({
    queryKey: [...QUERY_KEYS.GOALS, 'approved'],
    queryFn: () => getGoals({ status: 'approved' }),
  })
  const [selectedGoalId, progressValue] = form.watch(['goal', 'progress_value'])
  const approvedGoals = (goalsQuery.data ?? []).filter((goal) => goal.status === 'approved')
  const selectedGoal = approvedGoals.find((goal) => goal.id === selectedGoalId)

  const checkinMutation = useMutation({
    mutationFn: submitCheckin,
    onSuccess: (checkin) => {
      toast.success('Check-in submitted!')
      const submittedGoal = approvedGoals.find((goal) => goal.id === checkin.goal)
      form.reset({ goal: '', progress_value: 0, notes: '' })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(checkin.goal) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKINS(checkin.goal) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKINS_ALL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      if (submittedGoal) {
        setUpdatedGoal({ ...submittedGoal, progress: checkin.progress_value })
      }
      if (Number(submittedGoal?.progress || 0) < 100 && Number(checkin.progress_value) === 100) {
        fireGoalCompletionConfetti()
      }
    },
    onError: (error) => toast.error(error.response?.data?.notes?.[0] || 'Unable to submit check-in'),
  })
  function handleSubmit(values) {
    checkinMutation.mutate(values)
  }

  if (goalsQuery.isError) {
    return <ErrorState message="Unable to load approved goals." onRetry={goalsQuery.refetch} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Workflow"
        title="Submit Check-in"
        subtitle="Update your progress for the current quarter"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                {goalsQuery.isLoading ? (
                  <GoalSelectorSkeleton />
                ) : approvedGoals.length === 0 ? (
                  <div className="rounded-lg border border-slate-200">
                    <EmptyState
                      icon={ClipboardList}
                      title="No approved goals"
                      description="Check-ins can be submitted once a goal is approved."
                    />
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            const goal = approvedGoals.find((item) => item.id === value)
                            field.onChange(value)
                            form.setValue('progress_value', Number(goal?.progress || 0), { shouldValidate: true })
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an approved goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {approvedGoals.map((goal) => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="progress_value"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Progress</FormLabel>
                        <span className="text-sm font-semibold text-indigo-700">{progressValue}%</span>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize progress, blockers, and next steps."
                          className="min-h-28"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={checkinMutation.isPending || approvedGoals.length === 0}>
                    {checkinMutation.isPending ? 'Submitting...' : 'Submit Check-in'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedGoal ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">Selected goal</p>
              <GoalCard goal={{ ...selectedGoal, progress: progressValue }} />
            </div>
          ) : null}

          {updatedGoal ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">Latest submitted update</p>
              <GoalCard goal={updatedGoal} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
