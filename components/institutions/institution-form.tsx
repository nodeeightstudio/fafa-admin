import { useState } from 'react'
import { Institution } from '@/types/institution'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface InstitutionFormProps {
  onSubmit: (data: Omit<Institution, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  isLoading?: boolean
}

const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export function InstitutionForm({ onSubmit, onCancel, isLoading }: InstitutionFormProps) {
  const [formData, setFormData] = useState<Omit<Institution, 'id' | 'created_at' | 'updated_at'>>(() => ({
    name: '',
    type: 'school',
    logo_url: null,
    invite_code: generateInviteCode(),
    subscription_status: 'active',
    allow_global_posting: true,
    allow_global_resources: true,
    allow_global_counselors: true,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Institution Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. University of Excellence"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Institution Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as Institution['type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="school">School</SelectItem>
              <SelectItem value="university">University</SelectItem>
              <SelectItem value="ngo">NGO</SelectItem>
              <SelectItem value="youth_program">Youth Program</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite_code">Invite Code</Label>
          <div className="flex gap-2">
            <Input
              id="invite_code"
              value={formData.invite_code}
              readOnly
              className="bg-muted"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setFormData({ ...formData, invite_code: generateInviteCode() })}
            >
              Regen
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-medium">Permissions</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="global_posting" className="flex-1">Allow Global Posting</Label>
          <Checkbox
            id="global_posting"
            checked={formData.allow_global_posting}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_global_posting: !!checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="global_resources" className="flex-1">Access Global Resources</Label>
          <Checkbox
            id="global_resources"
            checked={formData.allow_global_resources}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_global_resources: !!checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="global_counselors" className="flex-1">Access Global Counselors</Label>
          <Checkbox
            id="global_counselors"
            checked={formData.allow_global_counselors}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_global_counselors: !!checked })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Institution'}
        </Button>
      </div>
    </form>
  )
}
