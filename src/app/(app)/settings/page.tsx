'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea } from '@/components/ui/Input'
import { ChipGroup } from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import type { ClientProfile } from '@/types/database'
import { cn } from '@/lib/utils'

type Section = 'brand' | 'drops' | 'filming' | 'social' | 'preferences'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'brand', label: 'Brand profile' },
  { key: 'drops', label: 'Product & drops' },
  { key: 'filming', label: 'Filming' },
  { key: 'social', label: 'Social & ads' },
  { key: 'preferences', label: 'Preferences' },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('brand')
  const [profile, setProfile] = useState<Partial<ClientProfile>>({})
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')

      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .single()
      if (!client) return
      setClientId(client.id)
      setClientName(client.name)

      const { data: p } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('client_id', client.id)
        .single()

      setProfile(p ?? {})
      setLoading(false)
    }
    init()
  }, [])

  function upd<K extends keyof ClientProfile>(key: K, value: ClientProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  async function save() {
    if (!clientId) return
    setSaving(true)
    await supabase
      .from('client_profiles')
      .upsert({ ...profile, client_id: clientId }, { onConflict: 'client_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] font-semibold text-text">Settings</h1>
        <p className="text-text-dim text-[13.5px] mt-1">
          Update your brand profile, filming setup, and preferences any time.
        </p>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {SECTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                'w-full text-left px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors duration-150',
                activeSection === key
                  ? 'bg-purple/10 text-purple border border-purple-soft'
                  : 'text-text-dim hover:text-text hover:bg-white/4'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-panel border border-border-default rounded-card p-7 space-y-6">
          {activeSection === 'brand' && (
            <>
              <SectionTitle>Brand profile</SectionTitle>
              <div className="space-y-5">
                <div>
                  <label className="block text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">
                    Client name
                  </label>
                  <p className="text-text text-[13.5px]">{clientName}</p>
                </div>
                <Textarea
                  label="Brand statement"
                  value={profile.brand_statement ?? ''}
                  onChange={(e) => upd('brand_statement', e.target.value)}
                  rows={4}
                  placeholder="What does your brand stand for?"
                />
                <Input
                  label="Competitor / reference brands"
                  value={profile.competitor_brands?.join(', ') ?? ''}
                  onChange={(e) =>
                    upd('competitor_brands', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
                  }
                  placeholder="e.g. Supreme, Palace, Corteiz"
                />
                <Input
                  label="Lookbook / brand guidelines URL"
                  value={profile.lookbook_url ?? ''}
                  onChange={(e) => upd('lookbook_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {activeSection === 'drops' && (
            <>
              <SectionTitle>Product & drops</SectionTitle>
              <div className="space-y-6">
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">
                    Drop frequency
                  </p>
                  <ChipGroup
                    options={['Weekly', 'Monthly', 'Seasonal']}
                    selected={profile.drop_frequency ? [profile.drop_frequency] : []}
                    onChange={(v) => upd('drop_frequency', v[0] as any ?? null)}
                  />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">
                    Drop style
                  </p>
                  <ChipGroup
                    options={['Themed collections', 'Standalone pieces', 'Mix of both']}
                    selected={profile.drop_style ? [profile.drop_style] : []}
                    onChange={(v) => upd('drop_style', v[0] as any ?? null)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Pieces per drop"
                    type="number"
                    value={profile.pieces_per_drop?.toString() ?? ''}
                    onChange={(e) => upd('pieces_per_drop', e.target.value ? parseInt(e.target.value) : null)}
                  />
                  <Input
                    label="Price point"
                    value={profile.price_point ?? ''}
                    onChange={(e) => upd('price_point', e.target.value)}
                    placeholder="e.g. $45–80"
                  />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">
                    Where you sell
                  </p>
                  <ChipGroup
                    options={['Own site', 'Depop & marketplaces', 'Pop-ups', 'Wholesale']}
                    selected={profile.sells_where ?? []}
                    onChange={(v) => upd('sells_where', v)}
                    multi
                  />
                </div>
              </div>
            </>
          )}

          {activeSection === 'filming' && (
            <>
              <SectionTitle>Filming setup</SectionTitle>
              <div className="space-y-6">
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Equipment</p>
                  <ChipGroup
                    options={['Phone', 'Camera', 'Both']}
                    selected={profile.filming_equipment ? [profile.filming_equipment] : []}
                    onChange={(v) => upd('filming_equipment', v[0] ?? null)}
                  />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Help filming</p>
                  <ChipGroup
                    options={['Solo', 'Sometimes', 'Yes regularly']}
                    selected={profile.filming_help ? [profile.filming_help] : []}
                    onChange={(v) => upd('filming_help', v[0] ?? null)}
                  />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Time per week</p>
                  <ChipGroup
                    options={['<1 hr', '1–3 hrs', '3+ hrs']}
                    selected={profile.filming_time_per_week ? [profile.filming_time_per_week] : []}
                    onChange={(v) => upd('filming_time_per_week', v[0] ?? null)}
                  />
                </div>
                <Input
                  label="Filming locations"
                  value={profile.filming_locations ?? ''}
                  onChange={(e) => upd('filming_locations', e.target.value)}
                  placeholder="e.g. Bedroom, city streets, local park"
                />
              </div>
            </>
          )}

          {activeSection === 'social' && (
            <>
              <SectionTitle>Social & ads</SectionTitle>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Instagram handle"
                    value={profile.ig_handle ?? ''}
                    onChange={(e) => upd('ig_handle', e.target.value)}
                    placeholder="@yourbrand"
                  />
                  <Input
                    label="TikTok handle"
                    value={profile.tiktok_handle ?? ''}
                    onChange={(e) => upd('tiktok_handle', e.target.value)}
                    placeholder="@yourbrand"
                  />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Posting frequency</p>
                  <ChipGroup
                    options={['Daily', '3–5x/week', '1–2x/week', 'A few times/month']}
                    selected={profile.posting_frequency ? [profile.posting_frequency] : []}
                    onChange={(v) => upd('posting_frequency', v[0] as any ?? null)}
                  />
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Monthly ad budget</p>
                  <Input
                    value={profile.ad_budget ?? ''}
                    onChange={(e) => upd('ad_budget', e.target.value)}
                    placeholder="e.g. $500–1,000"
                  />
                </div>
              </div>
            </>
          )}

          {activeSection === 'preferences' && (
            <>
              <SectionTitle>Preferences & account</SectionTitle>
              <div className="space-y-5">
                <div className="p-4 bg-panel-2 border border-border-default rounded-xl">
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-1">
                    Signed in as
                  </p>
                  <p className="text-text text-[13.5px]">{userEmail}</p>
                </div>

                <div>
                  <p className="text-[15px] font-semibold text-text mb-4">Notification preferences</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Weekly report ready', sublabel: 'Email when your report is published' },
                      { label: 'New ideas to review', sublabel: 'Email when Pulse Media adds content ideas' },
                      { label: 'Urgent items', sublabel: 'Email for time-sensitive feedback requests' },
                    ].map(({ label, sublabel }) => (
                      <label key={label} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mt-0.5 accent-purple"
                        />
                        <div>
                          <p className="text-text text-[13.5px] font-medium group-hover:text-purple transition-colors">{label}</p>
                          <p className="text-text-faint text-[12px]">{sublabel}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border-default">
                  <Button variant="ghost" onClick={signOut} className="text-red hover:bg-red/10">
                    Sign out
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          {activeSection !== 'preferences' && (
            <div className="pt-4 border-t border-border-default flex items-center gap-3">
              <Button onClick={save} loading={saving}>
                Save changes
              </Button>
              {saved && (
                <span className="text-green text-[13px] animate-fade-up">✓ Saved</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[17px] font-semibold text-text border-b border-border-default pb-4">
      {children}
    </h2>
  )
}
