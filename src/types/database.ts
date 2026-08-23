export type DropFrequency = 'weekly' | 'monthly' | 'seasonal'
export type DropStyle = 'themed_collections' | 'standalone_pieces' | 'mix'
export type ContentStatus =
  | 'draft'
  | 'awaiting_review'
  | 'approved'
  | 'footage_needed'
  | 'footage_received'
  | 'in_editing'
  | 'ready_to_post'
  | 'posted'
export type EditStatus = 'in_review' | 'changes_requested' | 'approved'
export type Platform = 'meta' | 'tiktok'
export type PeriodType = 'week' | 'month'
export type PostingFrequency = 'daily' | '3-5_week' | '1-2_week' | 'few_month'

export interface Client {
  id: string
  name: string
  brand_slug: string
  onboarding_completed_at: string | null
  created_at: string
}

export interface ClientProfile {
  client_id: string
  brand_statement: string | null
  customer_age_range: string | null
  customer_notes: string | null
  competitor_brands: string[] | null
  lookbook_url: string | null
  drop_frequency: DropFrequency | null
  drop_style: DropStyle | null
  pieces_per_drop: number | null
  price_point: string | null
  sells_where: string[] | null
  filming_equipment: string | null
  filming_help: string | null
  filming_time_per_week: string | null
  filming_locations: string | null
  ig_handle: string | null
  tiktok_handle: string | null
  posting_frequency: PostingFrequency | null
  top_post_url: string | null
  ads_history: string | null
  ad_budget: string | null
  success_definition: string[] | null
}

export interface ContentIdea {
  id: string
  client_id: string
  title: string
  hook: string | null
  shot_list: string | null
  reference_url: string | null
  caption_direction: string | null
  target_post_date: string | null
  status: ContentStatus
  revision_count: number
  created_at: string
  drive_folder_id: string | null
}

export interface FootageAsset {
  id: string
  content_idea_id: string
  drive_file_id: string
  drive_file_name: string
  synced_at: string
}

export interface Edit {
  id: string
  content_idea_id: string
  video_url: string
  version: number
  status: EditStatus
  created_at: string
}

export interface EditComment {
  id: string
  edit_id: string
  author_id: string
  timestamp_seconds: number
  body: string
  created_at: string
}

export interface Channel {
  id: string
  client_id: string
  name: string
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  author_id: string
  body: string
  reply_to_message_id: string | null
  edited_at: string | null
  deleted_at: string | null
  created_at: string
}

export interface AdMetricsDaily {
  id: string
  client_id: string
  date: string
  platform: Platform
  spend: number
  impressions: number
  clicks: number
  conversions: number
  roas: number
  ctr: number
  cpp: number
}

export interface SocialMetricsDaily {
  id: string
  client_id: string
  date: string
  platform: string
  views: number
  followers: number
}

export interface IdeaComment {
  id: string
  idea_id: string
  author_id: string
  body: string
  created_at: string
  edited_at: string | null
}

export interface Report {
  id: string
  client_id: string
  period_type: PeriodType
  period_start: string
  period_end: string
  generated_at: string
  notes: string | null
}
