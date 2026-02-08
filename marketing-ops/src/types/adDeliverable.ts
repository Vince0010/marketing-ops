export type AdPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube'
export type AdPostType = 'image' | 'video' | 'carousel' | 'story' | 'reel'

export interface AdDeliverable {
  tempId: string
  platform: AdPlatform
  post_type: AdPostType
  title: string
  description: string
}
