import React, { useEffect, useState } from 'react'
import { User, Clock, FileText } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { PersonLink } from './EntityLink'
import { getSupabaseClientOptional } from '../../../lib/supabase'

function ComingSoon({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
        <Badge variant="secondary" className="mt-3 text-[10px]">Coming Soon</Badge>
      </CardContent>
    </Card>
  )
}

export function OwnerTab({ item }: { item: any }) {
  const [person, setPerson] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tutorId = item?.tutorId
    if (!tutorId) { setLoading(false); return }

    const supabase = getSupabaseClientOptional()
    if (!supabase) { setLoading(false); return }

    supabase.schema('saas_core')
      .from('persons')
      .select('*')
      .eq('id', tutorId)
      .single()
      .then(({ data }) => {
        setPerson(data)
        setLoading(false)
      }, () => setLoading(false))
  }, [item?.tutorId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!person) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No owner assigned</p>
          <p className="text-xs text-muted-foreground mt-1">Edit this record to assign an owner.</p>
        </CardContent>
      </Card>
    )
  }

  const fields = [
    { label: 'Name', value: person.name },
    { label: 'Phone', value: person.phone, href: person.phone ? `tel:${person.phone}` : undefined },
    { label: 'Email', value: person.email, href: person.email ? `mailto:${person.email}` : undefined },
    { label: 'Document', value: person.document_number },
    { label: 'Address', value: [person.address, person.city, person.state].filter(Boolean).join(', ') },
  ].filter((f) => f.value)

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <PersonLink personId={person.id} kind={person.kind} className="text-base font-semibold">
              {person.name}
            </PersonLink>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] capitalize">{person.kind}</Badge>
              <Badge variant={person.is_active ? 'default' : 'secondary'} className="text-[10px]">
                {person.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <dl className="divide-y">
          {fields.map((f) => (
            <div key={f.label} className="grid grid-cols-3 gap-4 py-2.5">
              <dt className="text-sm text-muted-foreground">{f.label}</dt>
              <dd className="col-span-2 text-sm">
                {f.href ? (
                  <a href={f.href} className="text-primary hover:underline">{f.value}</a>
                ) : f.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export function SubjectHistoryTab() {
  return (
    <ComingSoon
      icon={Clock}
      title="History"
      description="View visit history, past reports, treatments, and timeline of events."
    />
  )
}

export function SubjectDocumentsTab() {
  return (
    <ComingSoon
      icon={FileText}
      title="Documents"
      description="Attach and manage files, lab results, images, and certificates."
    />
  )
}

export const SUBJECT_DETAIL_TABS = [
  { id: 'owner', label: 'Owner', component: OwnerTab },
  { id: 'history', label: 'History', component: SubjectHistoryTab },
  { id: 'documents', label: 'Documents', component: SubjectDocumentsTab },
]
