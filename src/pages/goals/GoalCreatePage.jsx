import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { z } from 'zod'

import { createGoal, getGoals, submitGoal } from '@/api/goals'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'

const goalSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    goal_type: z.enum(['individual', 'shared']),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    weightage: z.coerce.number().min(1, 'Weightage must be at least 1').max(100, 'Weightage cannot exceed 100'),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })

function WeightageDonut({ usedWeightage, draftWeightage }) {
  const totalUsed = Math.min(100, usedWeightage + draftWeightage)
  const remaining = Math.max(0, 100 - totalUsed)
  const data = [
    { name: 'Used', value: totalUsed, fill: '#4F46E5' },
    { name: 'Remaining', value: remaining, fill: '#e2e8f0' },
  ]

  return (
    <Card className="sticky top-6 rounded-xl border-slate-200 shadow-none">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Weightage allocation</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor how this goal affects your active quarterly load.</p>
        <div className="relative mt-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={68} outerRadius={92} startAngle={90} endAngle={-270}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{totalUsed}%</span>
            <span className="text-sm text-slate-500">allocated</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Already used</p>
            <p className="mt-1 font-semibold text-slate-900">{usedWeightage}%</p>
          </div>
          <div>
            <p className="text-slate-500">Remaining</p>
            <p className="mt-1 font-semibold text-slate-900">{remaining}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function applyServerErrors(error, setError) {
  const data = error.response?.data
  if (!data || typeof data !== 'object') return false

  let handled = false
  Object.entries(data).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      setError(field, { message: messages[0] })
      handled = true
    }
  })
  return handled
}

export default function GoalCreatePage() {
  const navigate = useNavigate()
  const goalsQuery = useQuery({ queryKey: QUERY_KEYS.GOALS, queryFn: () => getGoals() })
  const form = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      description: '',
      goal_type: 'individual',
      start_date: '',
      end_date: '',
      weightage: 1,
    },
  })
  const watchedWeightage = Number(form.watch('weightage') || 0)
  const usedWeightage = useMemo(
    () =>
      (goalsQuery.data ?? [])
        .filter((goal) => ['draft', 'pending', 'approved'].includes(goal.status))
        .reduce((sum, goal) => sum + Number(goal.weightage), 0),
    [goalsQuery.data],
  )

  const createMutation = useMutation({
    mutationFn: async ({ values, submitForReview }) => {
      const goal = await createGoal(values)
      if (submitForReview) {
        await submitGoal(goal.id)
      }
      return goal
    },
    onSuccess: (_, variables) => {
      toast.success(variables.submitForReview ? 'Goal submitted for review' : 'Goal saved as draft')
      navigate(ROUTES.GOALS)
    },
    onError: (error) => {
      if (!applyServerErrors(error, form.setError)) {
        toast.error(error.response?.data?.detail || 'Unable to save goal')
      }
    },
  })

  function submitWithIntent(submitForReview) {
    form.handleSubmit((values) => createMutation.mutate({ values, submitForReview }))()
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader breadcrumb="Dashboard > Goals" title="Create Goal" subtitle="Define your quarterly objective" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Launch manager approval workflow" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the objective and intended business outcome." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="goal_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="shared">Shared</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weightage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weightage</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {goalsQuery.isLoading ? <Skeleton className="h-[420px] rounded-xl" /> : <WeightageDonut usedWeightage={usedWeightage} draftWeightage={watchedWeightage} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white lg:left-60">
        <div className="mx-auto flex max-w-7xl justify-end gap-3 px-6 py-4 md:px-8">
          <Button variant="outline" disabled={createMutation.isPending} onClick={() => submitWithIntent(false)}>
            {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button disabled={createMutation.isPending} onClick={() => submitWithIntent(true)}>
            {createMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </div>
  )
}
