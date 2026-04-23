import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';

export type Booking = {
  id: string;
  route: string;
  date: string;
  time?: string;
  status: string;
  seat: string;
  busType: string;
  name?: string;
  contact?: string;
};

type BookingContextType = {
  bookings: Booking[];
  addBooking: (booking: Booking) => Promise<void>;
  updateBookingStatus: (id: string, status: string) => Promise<void>;
  updateBooking: (id: string, updated: Partial<Booking>) => Promise<void>;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      // fallback for initial UI development
      if (bookings.length === 0) {
        setBookings([
          {
            id: 'BKG-001',
            route: 'Colombo to Kandy',
            date: '2026-03-20',
            time: '08:00 AM',
            status: 'Confirmed',
            seat: '12A',
            busType: 'Single deck',
          },
        ]);
      }
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const addBooking = async (booking: Booking) => {
    setBookings(prev => [booking, ...prev]); // optimistic fallback BEFORE network request
    try {
      await axios.post(`${API_URL}/bookings`, booking);
      fetchBookings();
    } catch (error) {
      console.error('Failed to add booking:', error);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_URL}/bookings/${id}`, { status });
      fetchBookings();
    } catch (error) {
      console.error('Failed to update status:', error);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  const updateBooking = async (id: string, updated: Partial<Booking>) => {
    try {
      await axios.patch(`${API_URL}/bookings/${id}`, updated);
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
    }
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBookingStatus, updateBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
}
