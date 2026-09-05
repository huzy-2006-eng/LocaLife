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
  // Micro-Itinerary Bundling (PS6 brief §4): set when the traveler asked
  // for a plan rather than a single pick, e.g. "I have 4 hours this
  // afternoon, what should I do?". available_hours is the stated time
  // budget, defaulted at build time if the request implied a plan but
  // gave no explicit duration.
  wants_itinerary: boolean;
  available_hours: number | null;
};

// Matches the trailing ", <City>" segment of experiences.location_name.
// lat/lng are used to re-center proximity scoring on the chosen city.
export const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Udaipur', lat: 24.5854, lng: 73.7125 },
  { name: 'Goa', lat: 15.2993, lng: 74.1240 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { name: 'Kerala', lat: 9.4981, lng: 76.3388 },
  { name: 'Rishikesh', lat: 30.0869, lng: 78.2676 },
];

export function cityOf(locationName: string): string {
  const parts = locationName.split(',');
  return parts[parts.length - 1].trim();
}
