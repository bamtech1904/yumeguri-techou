import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from '@/types/place';

export interface Visit {
  id: string;
  date: string;
  bathName: string;
  visitTime: string;
  rating: number;
  comment: string;
  createdAt: string;
  address?: string;
  facilities?: string[];
  photos?: string[];
  fee?: number;
  repeatIntention?: 'definitely' | 'maybe' | 'once';
  ratings?: {
    cleanliness: number;
    crowdedness: number;
    service: number;
    comfort: number;
  };
  // Google Places integration
  placeId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Additional metadata
  phoneNumber?: string;
  website?: string;
  openingHours?: any;
  priceLevel?: number;
}

interface VisitStore {
  visits: Visit[];
  wishlist: Place[];
  addVisit: (visit: Visit) => void;
  updateVisit: (id: string, visit: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
  getVisitById: (id: string) => Visit | undefined;
  getVisitsForMonth: (month: string) => Visit[];
  addToWishlist: (place: Place) => void;
  removeFromWishlist: (placeId: string) => void;
  isInWishlist: (placeId: string) => boolean;
  loadVisits: () => Promise<void>;
  saveVisits: () => Promise<void>;
}

const STORAGE_KEY = 'sento_visits';
const WISHLIST_STORAGE_KEY = 'sento_wishlist';

export const useVisitStore = create<VisitStore>((set, get) => ({
  visits: [],
  wishlist: [],
  
  addVisit: (visit) => {
    set((state) => {
      const newVisits = [...state.visits, visit];
      saveVisitsToStorage(newVisits);
      return { visits: newVisits };
    });
  },
  
  updateVisit: (id, updatedVisit) => {
    set((state) => {
      const newVisits = state.visits.map((visit) =>
        visit.id === id ? { ...visit, ...updatedVisit } : visit
      );
      saveVisitsToStorage(newVisits);
      return { visits: newVisits };
    });
  },
  
  deleteVisit: (id) => {
    set((state) => {
      const newVisits = state.visits.filter((visit) => visit.id !== id);
      saveVisitsToStorage(newVisits);
      return { visits: newVisits };
    });
  },

  getVisitById: (id) => {
    const { visits } = get();
    return visits.find((visit) => visit.id === id);
  },
  
  getVisitsForMonth: (month) => {
    const { visits } = get();
    return visits.filter((visit) => visit.date.startsWith(month));
  },

  addToWishlist: (place) => {
    set((state) => {
      // 重複チェック
      const isAlreadyInWishlist = state.wishlist.some(
        (item) => item.place_id === place.place_id
      );
      if (isAlreadyInWishlist) {
        return state;
      }
      const newWishlist = [...state.wishlist, place];
      saveWishlistToStorage(newWishlist);
      return { wishlist: newWishlist };
    });
  },

  removeFromWishlist: (placeId) => {
    set((state) => {
      const newWishlist = state.wishlist.filter(
        (place) => place.place_id !== placeId
      );
      saveWishlistToStorage(newWishlist);
      return { wishlist: newWishlist };
    });
  },

  isInWishlist: (placeId) => {
    const { wishlist } = get();
    return wishlist.some((place) => place.place_id === placeId);
  },
  
  loadVisits: async () => {
    try {
      const storedVisits = await AsyncStorage.getItem(STORAGE_KEY);
      const storedWishlist = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      
      const visits = storedVisits ? JSON.parse(storedVisits) : [];
      const wishlist = storedWishlist ? JSON.parse(storedWishlist) : [];
      
      set({ visits, wishlist });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  },
  
  saveVisits: async () => {
    const { visits } = get();
    await saveVisitsToStorage(visits);
  },
}));

const saveVisitsToStorage = async (visits: Visit[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch (error) {
    console.error('Failed to save visits:', error);
  }
};

const saveWishlistToStorage = async (wishlist: Place[]) => {
  try {
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  } catch (error) {
    console.error('Failed to save wishlist:', error);
  }
};

// Load visits when the store is created
useVisitStore.getState().loadVisits();