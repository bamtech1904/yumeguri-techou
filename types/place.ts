export interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport?: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlacePhoto {
  height: number;
  width: number;
  photo_reference: string;
  html_attributions: string[];
}

export interface PlaceOpeningHours {
  open_now: boolean;
  periods?: Array<{
    close?: {
      day: number;
      time: string;
    };
    open: {
      day: number;
      time: string;
    };
  }>;
  weekday_text?: string[];
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: PlaceGeometry;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: PlacePhoto[];
  opening_hours?: PlaceOpeningHours;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  types: string[];
  reviews?: PlaceReview[];
  vicinity?: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
}

export interface PlaceSearchRequest {
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  keyword?: string;
  type?: string;
}

export interface PlaceSearchResponse {
  results: Place[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

export interface PlaceDetailsRequest {
  place_id: string;
  fields?: string[];
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'restricted' | 'undetermined';
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}