import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useCrmStore } from '../CrmContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'

export function LeadFormView({ onSaved }: { onSaved?: (id?: string) => void }) {
  const createLead = useCrmStore((s) => s.createLead)
  const fetchPipelines = useCrmStore((s) => s.fetchPipelines)
  const pipelines = useCrmStore((s) => s.pipelines)

  // Ensure pipelines are loaded so createLead can auto-create a deal
  useEffect(() => { if (pipelines.length === 0) fetchPipelines() }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const lead = await createLead({ name, email: email || undefined, phone: phone || undefined, company: company || undefined, notes: notes || undefined })
      onSaved?.(lead.id)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <SubpageHeader title="New Lead" subtitle="Capture a new lead" onBack={onSaved} actions={
        <div className="flex items-center gap-2">
          {onSaved && <button onClick={() => onSaved()} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors">Cancel</button>}
          <button onClick={handleSave} disabled={!name.trim() || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="h-3 w-3" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      } />
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="text-xs font-medium text-muted-foreground">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" autoFocus className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Company</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="text-xs font-medium text-muted-foreground">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-9999" className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" /></div>
      </div>
    </div>
  )
}
