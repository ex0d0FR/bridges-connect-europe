import { useState } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { useCreateFollowUpTask, type FollowUpTask } from "@/hooks/useFollowUpTasks"
import { useCampaignContacts } from "@/hooks/useCampaignContacts"
import { useCampaignChurches } from "@/hooks/useCampaigns"

interface CreateFollowUpTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

type TaskFormData = {
  title: string
  description?: string
  task_type: FollowUpTask['task_type']
  priority: FollowUpTask['priority']
  church_id?: string
  contact_id?: string
  due_date?: Date
}

export default function CreateFollowUpTaskDialog({ 
  open, 
  onOpenChange, 
  campaignId 
}: CreateFollowUpTaskDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TaskFormData>({
    defaultValues: {
      priority: 'medium',
      task_type: 'call'
    }
  })

  const createTask = useCreateFollowUpTask()
  const { data: contacts } = useCampaignContacts(campaignId)
  const { data: churches } = useCampaignChurches(campaignId)

  const taskType = watch('task_type')
  const selectedChurchId = watch('church_id')

  const onSubmit = async (data: TaskFormData) => {
    try {
      await createTask.mutateAsync({
        ...data,
        campaign_id: campaignId,
        due_date: selectedDate?.toISOString(),
        status: 'pending'
      })
      reset()
      setSelectedDate(undefined)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedDate(undefined)
    onOpenChange(false)
  }

  // Filter contacts by selected church
  const filteredContacts = contacts?.filter(contact => 
    !selectedChurchId || contact.church_id === selectedChurchId
  )

  const taskTypeLabels = {
    call: 'Phone Call',
    email: 'Email',
    meeting: 'Meeting',
    visit: 'Visit',
    follow_up_email: 'Follow-up Email'
  }

  const priorityLabels = {
    low: 'Low',
    medium: 'Medium', 
    high: 'High',
    urgent: 'Urgent'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Follow-up Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Call Pastor John about conference"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type</Label>
              <Select onValueChange={(value) => setValue('task_type', value as FollowUpTask['task_type'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(taskTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(value) => setValue('priority', value as FollowUpTask['priority'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="church_id">Church (Optional)</Label>
            <Select onValueChange={(value) => setValue('church_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select church" />
              </SelectTrigger>
              <SelectContent>
                {churches?.map((churchData) => (
                  <SelectItem key={churchData.church_id} value={churchData.church_id}>
                    {churchData.churches?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Contact (Optional)</Label>
            <Select onValueChange={(value) => setValue('contact_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {filteredContacts?.map((contact) => (
                  <SelectItem key={contact.contact_id} value={contact.contact_id}>
                    {contact.contacts?.first_name} {contact.contacts?.last_name}
                    {contact.contacts?.position && ` - ${contact.contacts.position}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional details about this task..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}