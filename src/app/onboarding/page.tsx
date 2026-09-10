'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { ChipGroup } from '@/components/ui/Chip'
import { cn } from '@/lib/utils'

// ─── Section definitions ──────────────────────────────────────────────────
const SECTIONS = [
  { label: 'Brand direction', steps: [1, 2, 3, 4] },
  { label: 'Product & drops', steps: [5, 6, 7] },
  { label: 'Filming reality', steps: [8, 9] },
  { label: 'Social & ads', steps: [10, 11, 12, 13, 14] },
]
const TOTAL_STEPS = 14

function getSectionIndex(step: number): number {
  return SECTIONS.findIndex((s) => s.steps.includes(step))
}

// ─── Profile state ────────────────────────────────────────────────────────
interface ProfileData {
  brand_statement: string
  customer_age_range: string[]
  customer_notes: string
  competitor_brands: string
  lookbook_url: string
  drop_frequency: string[]
  drop_style: string[]
  pieces_per_drop: string
  price_point: string
  sells_where: string[]
  filming_equipment: string[]
  filming_help: string[]
  filming_time_per_week: string[]
  filming_locations: string
  ig_handle: string
  tiktok_handle: string
  posting_frequency: string[]
  top_post_url: string
  ads_history: string[]
  ad_budget: string
  success_definition: string[]
}

const DEFAULT_PROFILE: ProfileData = {
  brand_statement: '',
  customer_age_range: [],
  customer_notes: '',
  competitor_brands: '',
  lookbook_url: '',
  drop_frequency: [],
  drop_style: [],
  pieces_per_drop: '',
  price_point: '',
  sells_where: [],
  filming_equipment: [],
  filming_help: [],
  filming_time_per_week: [],
  filming_locations: '',
  ig_handle: '',
  tiktok_handle: '',
  posting_frequency: [],
  top_post_url: '',
  ads_history: [],
  ad_budget: '',
  success_definition: [],
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [saving, setSaving] = useState(false)
  const [clientName, setClientName] = useState('there')
  const [error, setError] = useState<string | null>(null)

  const sectionIdx = getSectionIndex(step)
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const upd = useCallback(
    <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
      setProfile((p) => ({ ...p, [key]: value }))
    },
    []
  )

  // Persist partial data on each Next click
  async function savePartial() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch client id
      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .single()

      if (!client) return
      setClientName(client.name)

      await supabase.from('client_profiles').upsert(
        {
          client_id: client.id,
          brand_statement: profile.brand_statement || null,
          customer_age_range: profile.customer_age_range[0] ?? null,
          customer_notes: profile.customer_notes || null,
          competitor_brands: profile.competitor_brands
            ? profile.competitor_brands.split(',').map((s) => s.trim()).filter(Boolean)
            : null,
          lookbook_url: profile.lookbook_url || null,
          drop_frequency: profile.drop_frequency[0] ?? null,
          drop_style: profile.drop_style[0] ?? null,
          pieces_per_drop: profile.pieces_per_drop ? parseInt(profile.pieces_per_drop) : null,
          price_point: profile.price_point || null,
          sells_where: profile.sells_where.length ? profile.sells_where : null,
          filming_equipment: profile.filming_equipment[0] ?? null,
          filming_help: profile.filming_help[0] ?? null,
          filming_time_per_week: profile.filming_time_per_week[0] ?? null,
          filming_locations: profile.filming_locations || null,
          ig_handle: profile.ig_handle || null,
          tiktok_handle: profile.tiktok_handle || null,
          posting_frequency: profile.posting_frequency[0] ?? null,
          top_post_url: profile.top_post_url || null,
          ads_history: profile.ads_history[0] ?? null,
          ad_budget: profile.ad_budget || null,
          success_definition: profile.success_definition.length
            ? profile.success_definition
            : null,
        },
        { onConflict: 'client_id' }
      )
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function finishOnboarding() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await savePartial()

      await supabase
        .from('clients')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('user_id', user.id)

      router.push('/')
      router.refresh()
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function nextStep() {
    await savePartial()
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1))
  }

  const isCompletion = step === TOTAL_STEPS
  const isLastInput = step === TOTAL_STEPS - 1

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-start px-4 py-8',
        isCompletion && '[&_.onb-chrome]:opacity-40 [&_.onb-chrome]:pointer-events-none'
      )}
    >
      {/* Top chrome */}
      <div className="onb-chrome w-full max-w-[620px] mb-8">
        {/* Section labels */}
        <div className="flex gap-0 mb-4">
          {SECTIONS.map((sec, i) => (
            <div
              key={sec.label}
              className={cn(
                'flex-1 text-center text-[12px] font-semibold uppercase tracking-[0.05em] pb-2 border-b-2 transition-colors duration-200',
                i < sectionIdx
                  ? 'text-text-faint border-border-default'
                  : i === sectionIdx
                  ? 'text-purple border-purple'
                  : 'text-text-faint border-border-default'
              )}
            >
              {sec.label}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-border-default rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1DD9C5, #0CBCAA)',
            }}
          />
        </div>

        {/* Step counter */}
        <div className="flex justify-end mt-2">
          <span className="text-[12px] text-text-faint">
            {step} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Card */}
      <div
        key={step}
        className="w-full max-w-[620px] bg-panel border border-border-default rounded-[26px] px-10 py-10 animate-fade-up"
      >
        <StepContent
          step={step}
          profile={profile}
          upd={upd}
          clientName={clientName}
        />

        {error && (
          <p className="mt-4 text-red text-[13px] bg-red/10 border border-red/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        {/* Navigation */}
        {!isCompletion && (
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="text-text-dim text-[13.5px] hover:text-text transition-colors"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <Button
              onClick={isLastInput ? finishOnboarding : nextStep}
              loading={saving}
              size="md"
            >
              {isLastInput ? 'Finish →' : 'Next →'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step Content ─────────────────────────────────────────────────────────
interface StepContentProps {
  step: number
  profile: ProfileData
  upd: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void
  clientName: string
}

function StepContent({ step, profile, upd, clientName }: StepContentProps) {
  switch (step) {
    case 1:
      return (
        <div>
          <div
            className="w-14 h-14 rounded-pill flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, #1DD9C5, #0CBCAA)', boxShadow: '0 0 40px rgba(29,217,197,0.25)' }}
          >
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-[26px] font-semibold text-text mb-3">Let's set up your brand.</h1>
          <p className="text-text-dim text-[14px] leading-relaxed">
            15 minutes, four short sections. Everything you tell us here shapes your content ideas,
            shot lists, and ad strategy from day one — no re-asking on a kickoff call.
          </p>
        </div>
      )

    case 2:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">What does your brand stand for?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">
            Describe the brand in your own words — the vibe, who it's for, what makes it different.
          </p>
          <Textarea
            placeholder="e.g. Nova Streetwear is built for kids who grew up online — bold graphics, limited drops, streetwear that doesn't take itself too seriously."
            value={profile.brand_statement}
            onChange={(e) => upd('brand_statement', e.target.value)}
            rows={5}
          />
        </div>
      )

    case 3:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Who's your customer?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">Select an age range, then tell us more about them.</p>
          <div className="mb-5">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Age range</p>
            <ChipGroup
              options={['13–17', '18–24', '25–34', '35+']}
              selected={profile.customer_age_range}
              onChange={(v) => upd('customer_age_range', v)}
            />
          </div>
          <Textarea
            label="Where do they shop, who do they follow?"
            placeholder="e.g. They shop on Depop and ASOS, follow Supreme, Palace, and smaller independent streetwear brands..."
            value={profile.customer_notes}
            onChange={(e) => upd('customer_notes', e.target.value)}
            rows={4}
          />
        </div>
      )

    case 4:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Who are you up against — or inspired by?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">3–5 brand names helps us understand the space you're playing in.</p>
          <Input
            label="Competitor or reference brands"
            placeholder="e.g. Supreme, Palace, Corteiz, Sp5der"
            value={profile.competitor_brands}
            onChange={(e) => upd('competitor_brands', e.target.value)}
            className="mb-5"
          />
          <Input
            label="Brand guidelines / lookbook URL (optional)"
            placeholder="https://drive.google.com/..."
            value={profile.lookbook_url}
            onChange={(e) => upd('lookbook_url', e.target.value)}
          />
        </div>
      )

    case 5:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">How do you drop?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">This shapes how we pace content around your releases.</p>
          <div className="mb-6">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Drop frequency</p>
            <ChipGroup
              options={['Weekly', 'Monthly', 'Seasonal']}
              selected={profile.drop_frequency}
              onChange={(v) => upd('drop_frequency', v)}
            />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Drop style</p>
            <ChipGroup
              options={['Themed collections', 'Standalone pieces', 'Mix of both']}
              selected={profile.drop_style}
              onChange={(v) => upd('drop_style', v)}
            />
          </div>
        </div>
      )

    case 6:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Size and price</h2>
          <p className="text-text-dim text-[13.5px] mb-6">Helps us tailor content volume and positioning to your catalog.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pieces per drop"
              type="number"
              placeholder="e.g. 6"
              value={profile.pieces_per_drop}
              onChange={(e) => upd('pieces_per_drop', e.target.value)}
            />
            <Input
              label="Price point"
              placeholder="e.g. $45–80"
              value={profile.price_point}
              onChange={(e) => upd('price_point', e.target.value)}
            />
          </div>
        </div>
      )

    case 7:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Where do you sell?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">Select all that apply.</p>
          <ChipGroup
            options={['Own site', 'Depop & marketplaces', 'Pop-ups', 'Wholesale']}
            selected={profile.sells_where}
            onChange={(v) => upd('sells_where', v)}
            multi
          />
        </div>
      )

    case 8:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Filming equipment + help</h2>
          <p className="text-text-dim text-[13.5px] mb-6">We'll write shot lists that work with what you actually have.</p>
          <div className="mb-6">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">What do you film with?</p>
            <ChipGroup
              options={['Phone', 'Camera', 'Both']}
              selected={profile.filming_equipment}
              onChange={(v) => upd('filming_equipment', v)}
            />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Do you have someone to help film?</p>
            <ChipGroup
              options={['Solo', 'Sometimes', 'Yes regularly']}
              selected={profile.filming_help}
              onChange={(v) => upd('filming_help', v)}
            />
          </div>
        </div>
      )

    case 9:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Time + filming locations</h2>
          <p className="text-text-dim text-[13.5px] mb-6">Realistic briefs require knowing how much time you actually have.</p>
          <div className="mb-6">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Time available to film per week</p>
            <ChipGroup
              options={['<1 hr', '1–3 hrs', '3+ hrs']}
              selected={profile.filming_time_per_week}
              onChange={(v) => upd('filming_time_per_week', v)}
            />
          </div>
          <Input
            label="Where do you typically film?"
            placeholder="e.g. My bedroom, local park, city streets, studio"
            value={profile.filming_locations}
            onChange={(e) => upd('filming_locations', e.target.value)}
          />
        </div>
      )

    case 10:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Your platforms</h2>
          <p className="text-text-dim text-[13.5px] mb-6">We'll tailor each idea for the right format and audience.</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Input
              label="Instagram handle"
              placeholder="@yourbrand"
              value={profile.ig_handle}
              onChange={(e) => upd('ig_handle', e.target.value)}
            />
            <Input
              label="TikTok handle"
              placeholder="@yourbrand"
              value={profile.tiktok_handle}
              onChange={(e) => upd('tiktok_handle', e.target.value)}
            />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">How often do you post?</p>
            <ChipGroup
              options={['Daily', '3–5x/week', '1–2x/week', 'A few times/month']}
              selected={profile.posting_frequency}
              onChange={(v) => upd('posting_frequency', v)}
            />
          </div>
        </div>
      )

    case 11:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Got a post that really worked?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">
            Paste a link to your best-performing Instagram or TikTok post — we'll study what made it hit.
          </p>
          <Input
            label="Top-performing post URL (optional)"
            placeholder="https://www.instagram.com/p/..."
            value={profile.top_post_url}
            onChange={(e) => upd('top_post_url', e.target.value)}
          />
        </div>
      )

    case 12:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">Ads history + budget</h2>
          <p className="text-text-dim text-[13.5px] mb-6">Knowing your starting point helps us set realistic targets.</p>
          <div className="mb-6">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">Have you run ads before?</p>
            <ChipGroup
              options={['Never', 'A little', 'Yes regularly']}
              selected={profile.ads_history}
              onChange={(v) => upd('ads_history', v)}
            />
          </div>
          <Input
            label="Monthly ad budget range"
            placeholder="e.g. $500–1,000"
            value={profile.ad_budget}
            onChange={(e) => upd('ad_budget', e.target.value)}
          />
        </div>
      )

    case 13:
      return (
        <div>
          <h2 className="text-[22px] font-semibold text-text mb-2">What does success look like?</h2>
          <p className="text-text-dim text-[13.5px] mb-6">Select everything that matters to you.</p>
          <ChipGroup
            options={['More sales', 'More followers', 'Brand awareness', 'Both sales & followers']}
            selected={profile.success_definition}
            onChange={(v) => upd('success_definition', v)}
            multi
          />
        </div>
      )

    case 14:
      return (
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-pill flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, #1DD9C5, #0CBCAA)',
              boxShadow: '0 0 48px rgba(29,217,197,0.35)',
            }}
          >
            <span className="text-white text-3xl font-bold">S</span>
          </div>
          <h1 className="text-[26px] font-semibold text-text mb-3">
            You're all set, {clientName}.
          </h1>
          <p className="text-text-dim text-[13.5px] mb-8 leading-relaxed">
            {"Here's what happens next:"}
          </p>
          <ol className="text-left space-y-4 mb-8">
            {[
              "Your Socialy team reviews your brand profile and builds this month's content calendar — usually within 48 hours.",
              "You'll see your first batch of ideas and filming briefs appear in the Content tab, ready for your review and approval.",
              "Once you approve and film your first clips, upload them to your linked Drive folder — we'll handle everything from editing to posting.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple/15 border border-purple-soft flex items-center justify-center text-purple text-[12px] font-bold">
                  {i + 1}
                </span>
                <span className="text-text-dim text-[13.5px] leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
          <Button size="lg" onClick={() => (window.location.href = '/')}>
            Go to your dashboard →
          </Button>
        </div>
      )

    default:
      return null
  }
}
