'use client'

import { useState, useEffect, useCallback } from 'react'
import { CounsellorAvailability, DAYS_OF_WEEK } from '@/types/counsellor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'
import { getAvailability, addAvailabilitySlot, deleteAvailabilitySlot } from '@/lib/actions/availability'
import { toast } from 'sonner'

interface AvailabilitySchedulerProps {
  counsellorId: string
}

interface TimeSlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
}

export function AvailabilityScheduler({ counsellorId }: AvailabilitySchedulerProps) {
  const [availability, setAvailability] = useState<CounsellorAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  })

  const fetchAvailability = useCallback(async () => {
    try {
      const data = await getAvailability(counsellorId)
      setAvailability(data)
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }, [counsellorId])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const addSlot = async () => {
    try {
      await addAvailabilitySlot(counsellorId, newSlot)
      await fetchAvailability()
      // Reset form
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
      })
      toast.success('Availability slot added')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add availability slot')
    }
  }

  const deleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return
    }

    try {
      await deleteAvailabilitySlot(slotId)
      await fetchAvailability()
      toast.success('Availability slot deleted')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete availability slot')
    }
  }

  // Group availability by day
  const groupedAvailability = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayIndex: index,
    slots: availability.filter(a => a.day_of_week === index)
  }))

  if (loading) {
    return <div>Loading availability...</div>
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule Display */}
      <div className="grid gap-4">
        {groupedAvailability.map(({ day, dayIndex, slots }) => (
          <Card key={dayIndex}>
            <CardHeader>
              <CardTitle className="text-base">{day}</CardTitle>
              <CardDescription>
                {slots.length === 0 ? 'No availability set' : `${slots.length} time slot(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not available on this day</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Slot */}
      <Card>
        <CardHeader>
          <CardTitle>Add Availability Slot</CardTitle>
          <CardDescription>Set when this counsellor is available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="day">Day of Week</Label>
              <select
                id="day"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newSlot.day_of_week}
                onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={addSlot} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Availability Slot
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
