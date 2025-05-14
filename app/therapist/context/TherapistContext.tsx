import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { User, RealtimeChannel } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { TherapistProfile, Appointment, TherapistReview, AvailabilityException } from '../types';

// Availability structure
interface DayAvailability {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  breaks?: { start: string; end: string }[];
}

interface WeeklyAvailability {
  monday?: DayAvailability;
  tuesday?: DayAvailability;
  wednesday?: DayAvailability;
  thursday?: DayAvailability;
  friday?: DayAvailability;
  saturday?: DayAvailability;
  sunday?: DayAvailability;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  therapistId: string;
}

interface BookingData {
  therapistId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

interface TherapistContextType {
  // Auth state
  user: User | null;
  profile: TherapistProfile | null;
  loading: boolean;
  
  // Auth functions
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, profileData: Partial<TherapistProfile>) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<TherapistProfile>) => Promise<{ error?: any }>;
  
  // Availability functions
  updateAvailability: (availability: WeeklyAvailability) => Promise<{ error?: any }>;
  getAvailableTimeSlots: (therapistId: string, date: Date, duration?: number) => Promise<TimeSlot[]>;
  addAvailabilityException: (exception: Omit<AvailabilityException, 'id' | 'therapist_id' | 'created_at' | 'updated_at'>) => Promise<{ error?: any }>;
  removeAvailabilityException: (exceptionId: string) => Promise<{ error?: any }>;
  
  // Appointment functions
  bookAppointment: (bookingData: BookingData) => Promise<{ data?: Appointment; error?: any }>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<{ error?: any }>;
  rescheduleAppointment: (appointmentId: string, newStartTime: Date, newEndTime: Date) => Promise<{ error?: any }>;
  updateAppointmentStatus: (appointmentId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => Promise<{ error?: any }>;
  getAppointments: (filters?: { status?: string[]; date?: Date }) => Promise<Appointment[]>;
  generateMeetingLink: (appointmentId: string) => Promise<{ error?: any }>;
  
  // Therapist discovery functions
  loadTherapists: (filters?: { specialization?: string; minRating?: number; maxRate?: number }) => Promise<TherapistProfile[]>;
  getTherapistProfile: (therapistId: string) => Promise<TherapistProfile | null>;
  
  // Review functions
  getReviews: (therapistId?: string) => Promise<TherapistReview[]>;
  addReview: (appointmentId: string, rating: number, reviewText?: string, isAnonymous?: boolean) => Promise<{ error?: any }>;
  
  // Statistics functions
  getStats: () => Promise<{
    todayAppointments: number;
    weekRevenue: number;
    monthRevenue: number;
    totalPatients: number;
    averageRating: number;
  }>;
  
  // Real-time subscriptions
  subscribeToAppointments: (callback: (appointment: Appointment) => void) => () => void;
}

const TherapistContext = createContext<TherapistContextType | undefined>(undefined);

export function TherapistProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointmentSubscription, setAppointmentSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          // Cleanup subscriptions
          if (appointmentSubscription) {
            appointmentSubscription.unsubscribe();
            setAppointmentSubscription(null);
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  // Auth functions
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, profileData: Partial<TherapistProfile>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'therapist', // Set role in user metadata
          full_name: profileData.bio, // Add any other metadata you need
        },
      },
    });

    if (error) return { error };

    if (data.user) {
      // The triggers will automatically create the user in public.users with role 'therapist'
      
      // Create therapist profile
      const { error: profileError } = await supabase
        .from('therapist_profiles')
        .insert({
          id: data.user.id,
          ...profileData,
        });

      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<TherapistProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('therapist_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  // Availability functions
  const updateAvailability = async (availability: WeeklyAvailability) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('therapist_profiles')
      .update({ 
        availability,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, availability } : null);
    }

    return { error };
  };

  const getAvailableTimeSlots = async (
    therapistId: string, 
    date: Date, 
    duration: number = 60
  ): Promise<TimeSlot[]> => {
    try {
      // Get therapist's availability
      const { data: therapist } = await supabase
        .from('therapist_profiles')
        .select('availability')
        .eq('id', therapistId)
        .single();

      if (!therapist?.availability) return [];

      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const dayAvailability = therapist.availability[dayOfWeek] as DayAvailability;

      if (!dayAvailability) return [];

      // Get existing appointments for this date
      const dateStr = date.toISOString().split('T')[0];
      const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('therapist_id', therapistId)
        .gte('start_time', `${dateStr}T00:00:00`)
        .lt('start_time', `${dateStr}T23:59:59`)
        .in('status', ['pending', 'confirmed']);

      // Get availability exceptions
      const { data: exceptions } = await supabase
        .from('therapist_availability_exceptions')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('date', dateStr);

      // Generate time slots
      const slots: TimeSlot[] = [];
      const startTime = new Date(date);
      const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(date);
      const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);

      const current = new Date(startTime);
      
      while (current.getTime() + duration * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(current.getTime() + duration * 60000);
        
        // Check if slot is available
        let available = true;
        
        // Check against existing appointments
        const hasConflict = appointments?.some(apt => {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return (current < aptEnd && slotEnd > aptStart);
        });
        
        if (hasConflict) available = false;
        
        // Check against breaks
        if (dayAvailability.breaks) {
          const hasBreakConflict = dayAvailability.breaks.some(breakTime => {
            const breakStart = new Date(date);
            const [bStartHour, bStartMinute] = breakTime.start.split(':').map(Number);
            breakStart.setHours(bStartHour, bStartMinute, 0, 0);
            
            const breakEnd = new Date(date);
            const [bEndHour, bEndMinute] = breakTime.end.split(':').map(Number);
            breakEnd.setHours(bEndHour, bEndMinute, 0, 0);
            
            return (current < breakEnd && slotEnd > breakStart);
          });
          
          if (hasBreakConflict) available = false;
        }
        
        // Check against exceptions
        const hasException = exceptions?.some(exc => {
          const excStart = new Date(`${dateStr}T${exc.start_time}`);
          const excEnd = new Date(`${dateStr}T${exc.end_time}`);
          return !exc.is_available && (current < excEnd && slotEnd > excStart);
        });
        
        if (hasException) available = false;
        
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          available,
          therapistId,
        });
        
        current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
      }
      
      return slots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  };

  const addAvailabilityException = async (exception: Omit<AvailabilityException, 'id' | 'therapist_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('therapist_availability_exceptions')
      .insert({
        ...exception,
        therapist_id: user.id,
      });

    return { error };
  };

  const removeAvailabilityException = async (exceptionId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('therapist_availability_exceptions')
      .delete()
      .eq('id', exceptionId)
      .eq('therapist_id', user.id);

    return { error };
  };

  // Appointment functions
  const bookAppointment = async (bookingData: BookingData) => {
    try {
      // Use Supabase RPC function to ensure atomic booking
      const { data, error } = await supabase.rpc('book_appointment', {
        p_therapist_id: bookingData.therapistId,
        p_client_id: user?.id,
        p_start_time: bookingData.startTime.toISOString(),
        p_end_time: bookingData.endTime.toISOString(),
        p_notes: bookingData.notes,
      });

      if (error) {
        if (error.message.includes('conflict')) {
          return { error: 'This time slot is no longer available. Please select another time.' };
        }
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const cancelAppointment = async (appointmentId: string, reason?: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    return { error };
  };

  const rescheduleAppointment = async (appointmentId: string, newStartTime: Date, newEndTime: Date) => {
    try {
      // Get current appointment
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('therapist_id, client_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError) return { error: fetchError };

      // Use RPC to reschedule atomically
      const { error } = await supabase.rpc('reschedule_appointment', {
        p_appointment_id: appointmentId,
        p_therapist_id: appointment.therapist_id,
        p_new_start_time: newStartTime.toISOString(),
        p_new_end_time: newEndTime.toISOString(),
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    return { error };
  };

  const getAppointments = async (filters?: { status?: string[]; date?: Date }): Promise<Appointment[]> => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:client_id (
            id,
            email,
            full_name
          ),
          therapist:therapist_id (
            id,
            bio,
            qualifications,
            profile_picture
          )
        `);

      if (user && profile) {
        query = query.eq('therapist_id', user.id);
      }

      if (filters?.status) {
        query = query.in('status', filters.status);
      }

      if (filters?.date) {
        const dateStr = filters.date.toISOString().split('T')[0];
        query = query
          .gte('start_time', `${dateStr}T00:00:00`)
          .lt('start_time', `${dateStr}T23:59:59`);
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const generateMeetingLink = async (appointmentId: string) => {
    // Generate a unique meeting link (you can integrate with video call services)
    const meetingLink = `https://meet.uniwell.app/${appointmentId}`;
    
    const { error } = await supabase
      .from('appointments')
      .update({ 
        meeting_link: meetingLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    return { error };
  };

  // Therapist discovery functions
  const loadTherapists = async (filters?: { 
    specialization?: string; 
    minRating?: number; 
    maxRate?: number 
  }): Promise<TherapistProfile[]> => {
    try {
      let query = supabase
        .from('therapist_profiles')
        .select(`
          *,
          therapist_reviews (
            rating
          )
        `)
        .eq('verified', true);

      if (filters?.specialization) {
        query = query.contains('specialization', [filters.specialization]);
      }

      if (filters?.maxRate) {
        query = query.lte('consultation_rates', filters.maxRate);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading therapists:', error);
        return [];
      }

      // Filter by rating if needed
      let filteredData = data || [];
      if (filters?.minRating) {
        filteredData = filteredData.filter(therapist => {
          const reviews = therapist.therapist_reviews as any[];
          if (!reviews || reviews.length === 0) return false;
          
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          return avgRating >= filters.minRating!;
        });
      }

      return filteredData;
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const getTherapistProfile = async (therapistId: string): Promise<TherapistProfile | null> => {
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', therapistId)
      .single();

    if (error) {
      console.error('Error fetching therapist profile:', error);
      return null;
    }

    return data;
  };

  // Review functions
  const getReviews = async (therapistId?: string): Promise<TherapistReview[]> => {
    try {
      let query = supabase
        .from('therapist_reviews')
        .select(`
          *,
          client:client_id (
            full_name
          )
        `);

      if (therapistId) {
        query = query.eq('therapist_id', therapistId);
      } else if (user) {
        query = query.eq('therapist_id', user.id);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const addReview = async (
    appointmentId: string, 
    rating: number, 
    reviewText?: string, 
    isAnonymous: boolean = false
  ) => {
    if (!user) return { error: 'Not authenticated' };

    // Get appointment details
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('therapist_id')
      .eq('id', appointmentId)
      .eq('client_id', user.id)
      .single();

    if (fetchError) return { error: fetchError };

    const { error } = await supabase
      .from('therapist_reviews')
      .insert({
        therapist_id: appointment.therapist_id,
        client_id: user.id,
        appointment_id: appointmentId,
        rating,
        review_text: reviewText,
        is_anonymous: isAnonymous,
      });

    return { error };
  };

  // Statistics functions
  const getStats = async () => {
    if (!user) {
      return {
        todayAppointments: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalPatients: 0,
        averageRating: 0,
      };
    }

    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];

      // Today's appointments
      const { data: todayAppts } = await supabase
        .from('appointments')
        .select('id')
        .eq('therapist_id', user.id)
        .gte('start_time', `${todayStr}T00:00:00`)
        .lt('start_time', `${todayStr}T23:59:59`);

      // Week revenue
      const { data: weekAppts } = await supabase
        .from('appointments')
        .select('payment_amount')
        .eq('therapist_id', user.id)
        .eq('payment_status', 'paid')
        .gte('created_at', weekAgo.toISOString());

      // Month revenue
      const { data: monthAppts } = await supabase
        .from('appointments')
        .select('payment_amount')
        .eq('therapist_id', user.id)
        .eq('payment_status', 'paid')
        .gte('created_at', monthAgo.toISOString());

      // Total unique patients
      const { data: patients } = await supabase
        .from('appointments')
        .select('client_id')
        .eq('therapist_id', user.id);

      // Average rating
      const { data: reviews } = await supabase
        .from('therapist_reviews')
        .select('rating')
        .eq('therapist_id', user.id);

      const uniquePatients = new Set(patients?.map(p => p.client_id) || []);
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        todayAppointments: todayAppts?.length || 0,
        weekRevenue: weekAppts?.reduce((sum, apt) => sum + (apt.payment_amount || 0), 0) || 0,
        monthRevenue: monthAppts?.reduce((sum, apt) => sum + (apt.payment_amount || 0), 0) || 0,
        totalPatients: uniquePatients.size,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        todayAppointments: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalPatients: 0,
        averageRating: 0,
      };
    }
  };

  // Real-time subscriptions
  const subscribeToAppointments = (callback: (appointment: Appointment) => void) => {
    if (!user) return () => {};

    const subscription = supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `therapist_id=eq.${user.id}`,
        },
        (payload) => {
          callback(payload.new as Appointment);
        }
      )
      .subscribe();

    setAppointmentSubscription(subscription);

    return () => {
      subscription.unsubscribe();
      setAppointmentSubscription(null);
    };
  };

  return (
    <TherapistContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      updateAvailability,
      getAvailableTimeSlots,
      addAvailabilityException,
      removeAvailabilityException,
      bookAppointment,
      cancelAppointment,
      rescheduleAppointment,
      updateAppointmentStatus,
      getAppointments,
      generateMeetingLink,
      loadTherapists,
      getTherapistProfile,
      getReviews,
      addReview,
      getStats,
      subscribeToAppointments,
    }}>
      {children}
    </TherapistContext.Provider>
  );
}

export const useTherapist = () => {
  const context = useContext(TherapistContext);
  if (!context) {
    throw new Error('useTherapist must be used within a TherapistProvider');
  }
  return context;
};

export type { WeeklyAvailability, DayAvailability, TimeSlot, BookingData };
