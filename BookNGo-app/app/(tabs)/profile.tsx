<<<<<<< HEAD
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const user = {
        name: "Himath Nimsitha",
        email: "himath@example.com",
        phone: "+94 77 123 4567",
        memberSince: "March 2026",
        trips: 12,
        points: 450
    };

    const settingsOptions = [
        { id: '1', title: 'Personal Information', icon: 'person.fill' },
        { id: '2', title: 'Payment Methods', icon: 'creditcard.fill' },
        { id: '3', title: 'Notifications', icon: 'bell.fill' },
        { id: '4', title: 'Privacy & Security', icon: 'shield.fill' },
        { id: '5', title: 'Help & Support', icon: 'questionmark.circle.fill' },
        { id: '6', title: 'Logout', icon: 'rectangle.portrait.and.arrow.right', color: '#FF3B30' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* User Info Card */}
                <View style={styles.profileCard}>
                    <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
                        <Text style={styles.avatarText}>{user.name.split(' ').map(n => n[0]).join('')}</Text>
                    </View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user.trips}</Text>
                            <Text style={styles.statLabel}>Trips</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user.points}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.settingsCard}>
                    {settingsOptions.map((option, index) => (
                        <TouchableOpacity 
                            key={option.id} 
                            style={[
                                styles.optionItem, 
                                index === settingsOptions.length - 1 ? { borderBottomWidth: 0 } : {}
                            ]}
                        >
                            <View style={[styles.optionIconContainer, { backgroundColor: '#F0F0F0' }]}>
                                <IconSymbol 
                                    name={option.icon as any} 
                                    size={20} 
                                    color={option.color || '#333'} 
                                />
                            </View>
                            <Text style={[styles.optionTitle, option.color ? { color: option.color } : {}]}>
                                {option.title}
                            </Text>
                            <IconSymbol name="chevron.right" size={16} color="#CCC" />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.footerText}>BookAndGo v1.0.4 - Premium Mobile Travel</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#000000',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 15,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4AF37',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4AF37',
        marginBottom: 15,
        marginLeft: 5,
    },
    settingsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 30,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    optionTitle: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    footerText: {
        textAlign: 'center',
        color: '#BBB',
        fontSize: 12,
        marginBottom: 40,
    }
=======
import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Simulated Profile Performance data
  const totalTrips = 42;
  const totalSpent = "Rs. 35,500";
  const mostFrequentRoute = "Colombo - Kandy";

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={60} color="#fff" />
        </View>
        <ThemedText style={styles.headerTitle}>User Profile</ThemedText>
        <ThemedText style={{color: '#333'}}>Passionate Traveler</ThemedText>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Performance & Activities</ThemedText>
        
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: theme.background }]}>
            <MaterialIcons name="directions-bus" size={32} color="#3498db" />
            <ThemedText style={styles.statValue}>{totalTrips}</ThemedText>
            <ThemedText style={styles.statLabel}>Trips Taken</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.background }]}>
            <MaterialIcons name="account-balance-wallet" size={32} color="#2ecc71" />
            <ThemedText style={styles.statValue}>{totalSpent}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
          </View>
        </View>

        <View style={[styles.frequentRow, { backgroundColor: theme.background }]}>
          <MaterialIcons name="star" size={24} color="#f1c40f" />
          <View style={{ marginLeft: 15 }}>
            <ThemedText style={styles.statLabel}>Most Frequent Route</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{mostFrequentRoute}</ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  card: {
    margin: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  frequentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 5,
  }
>>>>>>> origin/bookings
});
