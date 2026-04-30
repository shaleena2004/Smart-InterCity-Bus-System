import React from 'react';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  const { role, phone } = useLocalSearchParams();
  const isDriver = role === 'driver';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          href: { pathname: '/home', params: { role, phone } },
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: isDriver ? null : { pathname: '/search', params: { role, phone } },
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          href: isDriver ? null : { pathname: '/tickets', params: { role, phone } },
          title: 'My Tickets',
          tabBarIcon: ({ color }) => <Ionicons name="ticket" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          href: isDriver ? { pathname: '/schedule', params: { role, phone } } : null,
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          href: isDriver ? { pathname: '/earnings', params: { role, phone } } : null,
          title: 'Earnings',
          tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          href: isDriver ? { pathname: '/maintenance', params: { role, phone } } : null,
          title: 'Maintenance',
          tabBarIcon: ({ color }) => <Ionicons name="construct" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: { pathname: '/profile', params: { role, phone } },
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
