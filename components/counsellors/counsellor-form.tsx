'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CounsellorFormData, CounsellorStatus, SPECIALTIES } from '@/types/counsellor'

interface CounsellorFormProps {
  initialData?: Partial<CounsellorFormData>
  onSubmit: (data: CounsellorFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function CounsellorForm({ initialData, onSubmit, onCancel, isLoading }: CounsellorFormProps) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    initialData?.specialties || []
  )
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialData?.languages || ['English']
  )
  const [qualifications, setQualifications] = useState<string[]>(
    initialData?.qualifications || []
  )
  const [newQualification, setNewQualification] = useState('')

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CounsellorFormData>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      bio: initialData?.bio || '',
      avatar_url: initialData?.avatar_url || '',
      experience: initialData?.experience || '',
      is_active: initialData?.is_active ?? true,
      is_verified: initialData?.is_verified ?? false,
      status: initialData?.status || 'pending',
      specialties: initialData?.specialties || [],
      languages: initialData?.languages || ['English'],
      qualifications: initialData?.qualifications || []
    }
  })

  const toggleSpecialty = (specialty: string) => {
    const updated = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty]
    setSelectedSpecialties(updated)
    setValue('specialties', updated)
  }

  const addQualification = () => {
    if (newQualification.trim()) {
      const updated = [...qualifications, newQualification.trim()]
      setQualifications(updated)
      setValue('qualifications', updated)
      setNewQualification('')
    }
  }

  const removeQualification = (index: number) => {
    const updated = qualifications.filter((_, i) => i !== index)
    setQualifications(updated)
    setValue('qualifications', updated)
  }

  const handleFormSubmit = async (data: CounsellorFormData) => {
    await onSubmit({
      ...data,
      specialties: selectedSpecialties,
      languages: selectedLanguages,
      qualifications
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name', { required: 'Name is required' })}
            placeholder="Dr. Jane Doe"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+233 XX XXX XXXX"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            placeholder="Brief professional biography..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="avatar_url">Avatar URL</Label>
          <Input
            id="avatar_url"
            {...register('avatar_url')}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </div>

      {/* Professional Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Professional Details</h3>

        <div>
          <Label>Specialties *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {SPECIALTIES.map((specialty) => (
              <div key={specialty} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialty-${specialty}`}
                  checked={selectedSpecialties.includes(specialty)}
                  onCheckedChange={() => toggleSpecialty(specialty)}
                />
                <label
                  htmlFor={`specialty-${specialty}`}
                  className="text-sm cursor-pointer"
                >
                  {specialty}
                </label>
              </div>
            ))}
          </div>
          {selectedSpecialties.length === 0 && (
            <p className="text-sm text-red-500 mt-1">At least one specialty is required</p>
          )}
        </div>

        <div>
          <Label htmlFor="experience">Experience</Label>
          <Input
            id="experience"
            {...register('experience')}
            placeholder="10+ Years"
          />
        </div>

        <div>
          <Label>Qualifications</Label>
          <div className="space-y-2">
            {qualifications.map((qual, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={qual} readOnly />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQualification(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newQualification}
                onChange={(e) => setNewQualification(e.target.value)}
                placeholder="Add qualification..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addQualification()
                  }
                }}
              />
              <Button type="button" onClick={addQualification}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status & Settings</h3>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as CounsellorStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={watch('is_active')}
            onCheckedChange={(checked) => setValue('is_active', checked as boolean)}
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Account Active
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_verified"
            checked={watch('is_verified')}
            onCheckedChange={(checked) => setValue('is_verified', checked as boolean)}
          />
          <Label htmlFor="is_verified" className="cursor-pointer">
            Verified Counsellor
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || selectedSpecialties.length === 0}>
          {isLoading ? 'Saving...' : initialData ? 'Update Counsellor' : 'Create Counsellor'}
        </Button>
      </div>
    </form>
  )
}
