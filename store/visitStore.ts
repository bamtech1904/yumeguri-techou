import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  addVisit: (visit: Visit) => void;
  updateVisit: (id: string, visit: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
  getVisitById: (id: string) => Visit | undefined;
  getVisitsForMonth: (month: string) => Visit[];
  loadVisits: () => Promise<void>;
  saveVisits: () => Promise<void>;
}

const STORAGE_KEY = 'sento_visits';

export const useVisitStore = create<VisitStore>((set, get) => ({
  visits: [],
  
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
  
  loadVisits: async () => {
    try {
      const storedVisits = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedVisits) {
        const visits = JSON.parse(storedVisits);
        set({ visits });
      }
    } catch (error) {
      console.error('Failed to load visits:', error);
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

// Load visits when the store is created
useVisitStore.getState().loadVisits();