export type Role = 'traveler' | 'host';
export type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
export type InteractionType = 'view' | 'save' | 'unsave' | 'swipe_right' | 'swipe_left' | 'interest' | 'book';

export const INTEREST_TAGS = ['food', 'culture', 'art', 'nightlife', 'nature', 'workshops', 'outdoors'] as const;
export type InterestTag = (typeof INTEREST_TAGS)[number];

export const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: 'morning', label: 'Morning (6am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 9pm)' },
  { value: 'night', label: 'Night (9pm onward)' },
  { value: 'any', label: 'Any time' },
];

export type Profile = {
  id: string;
  name: string;
  role: Role;
  language: 'en' | 'hi';
  city: string;
  created_at: string;
};

export type TravelerProfile = {
  user_id: string;
  interest_tags: string[];
  budget_min: number;
  budget_max: number;
  time_window: TimeWindow;
  lat: number;
  lng: number;
  updated_at: string;
};

export type HostProfile = {
  user_id: string;
  business_name: string;
  verified: boolean;
  created_at: string;
};

export type Experience = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  capacity: number;
  location_name: string;
  lat: number;
  lng: number;
  time_slots: string[];
  duration_label: string;
  image_url: string;
  review_count: number;
  rating: number;
  status: 'live' | 'draft';
  created_at: string;
};

export type ScoredExperience = Experience & {
  host_name: string;
  interest_match: number;
  budget_fit: number;
  time_fit: number;
  proximity: number;
  hidden_gem_bonus: number;
  score: number;
};

export type Interaction = {
  id: string;
  user_id: string;
  experience_id: string;
  type: InteractionType;
  created_at: string;
};

export type ConciergeFilters = {
  tags: string[];
  budget_max: number | null;
  time_window: TimeWindow | null;
  mood: string;
};
