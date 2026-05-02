<<<<<<< HEAD
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const reports = [
        { id: '1', title: 'Route Status Report', icon: 'location.fill', description: 'View current active routes, delays, and general status.' },
        { id: '2', title: 'Trip Progress Report', icon: 'map.fill', description: 'Monitor how far along active trips are with completion %.' },
        { id: '3', title: 'Schedule Performance', icon: 'chart.bar.fill', description: 'Overall On-Time vs Delayed metrics for past 30 days.' },
        { id: '4', title: 'Bus Route Report', icon: 'bus.fill', description: 'Comprehensive data on interchanges, stops, and times.' },
    ];

    const router = useRouter();

    const handleReportPress = (reportName: string) => {
        if (reportName === 'Route Status Report') {
            router.push('/route-status');
        } else if (reportName === 'Trip Progress Report') {
            router.push('/trip-progress');
        } else if (reportName === 'Schedule Performance') {
            router.push('/schedule-performance');
        } else if (reportName === 'Bus Route Report') {
            router.push('/bus-route-report');
        } else {
            console.log(`Open report: ${reportName}`);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>Reporting Dashboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.quickActionCard}>
                    <Text style={styles.cardTitle}>Quick Actions</Text>
                    <TouchableOpacity 
                        style={[styles.createBtn, { backgroundColor: theme.tint }]} 
                        onPress={() => router.push('/create-route')}
                    >
                        <IconSymbol name="plus.circle.fill" size={24} color="#000" />
                        <Text style={styles.createBtnText}>Create New Schedule</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.subtitle, { color: theme.tint, marginTop: 10 }]}>Available Reports</Text>

                {reports.map((report) => (
                    <TouchableOpacity
                        key={report.id}
                        style={[styles.card, { borderColor: theme.tint, borderWidth: 1 }]}
                        onPress={() => handleReportPress(report.title)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.tint }]}>
                            {/* @ts-ignore - using map name to match typical SF Symbols if used */}
                            <IconSymbol name={report.icon as any} size={28} color="#222" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{report.title}</Text>
                            <Text style={styles.cardDesc}>{report.description}</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color={theme.tint} />
                    </TouchableOpacity>
                ))}

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
    scrollContent: {
        padding: 15,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        color: '#D4AF37',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardDesc: {
        color: '#666666',
        fontSize: 12,
    },
    quickActionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 10,
    }
=======
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [feedbacks, setFeedbacks] = useState([
    { id: '1', passenger: 'Kasun Perera', sentiment: 'Positive', comment: 'Great service, bus arrived on time!' },
    { id: '2', passenger: 'Nimali Fernando', sentiment: 'Positive', comment: 'Comfortable seats, trip was smooth.' },
  ]);

  const [newPassenger, setNewPassenger] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newSentiment, setNewSentiment] = useState<'Positive'|'Negative'|null>('Positive');

  const submitFeedback = () => {
    if (!newPassenger || !newComment) {
      alert('Please fill out all fields');
      return;
    }
    setFeedbacks([
      { id: Math.random().toString(), passenger: newPassenger, sentiment: newSentiment || 'Positive', comment: newComment },
      ...feedbacks
    ]);
    setNewPassenger('');
    setNewComment('');
    setNewSentiment('Positive');
    alert('Feedback submitted!');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>Passenger Feedback</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Add Your Feedback</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Your Name"
            placeholderTextColor={theme.icon}
            value={newPassenger}
            onChangeText={setNewPassenger}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <TouchableOpacity
              style={[
                styles.feedbackBtn, 
                { backgroundColor: newSentiment === 'Positive' ? '#2ecc71' : '#ccc', flex: 1, marginRight: 5 }
              ]}
              onPress={() => setNewSentiment('Positive')}
            >
              <ThemedText style={styles.feedbackBtnText}>Positive</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.feedbackBtn, 
                { backgroundColor: newSentiment === 'Negative' ? '#e74c3c' : '#ccc', flex: 1, marginLeft: 5 }
              ]}
              onPress={() => setNewSentiment('Negative')}
            >
              <ThemedText style={styles.feedbackBtnText}>Negative</ThemedText>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top' }]}
            placeholder="Your Comment"
            placeholderTextColor={theme.icon}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.tint }]} onPress={submitFeedback}>
            <ThemedText style={styles.submitBtnText}>Submit</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedText style={[styles.sectionTitle, { marginLeft: 4, marginBottom: 16 }]}>Recent Feedbacks</ThemedText>

        {feedbacks.map((item) => (
          <ThemedView key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.feedbackHeader}>
              <ThemedText style={styles.passengerName}>{item.passenger}</ThemedText>
              <View style={[styles.sentimentBadge, { backgroundColor: item.sentiment === 'Positive' ? '#e8f8f5' : '#fdedec' }]}>
                <MaterialIcons 
                  name={item.sentiment === 'Positive' ? "thumb-up" : "thumb-down"} 
                  size={16} 
                  color={item.sentiment === 'Positive' ? '#2ecc71' : '#e74c3c'} 
                />
                <ThemedText style={[styles.sentimentText, { color: item.sentiment === 'Positive' ? '#2ecc71' : '#e74c3c' }]}>
                  {item.sentiment}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.commentText}>{item.comment}</ThemedText>
          </ThemedView>
        ))}
      </View>
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
    backgroundColor: '#FDB813',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  content: {
    padding: 20,
    marginTop: -30,
  },
  formCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  feedbackBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitBtn: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#121212',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  commentText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
>>>>>>> origin/bookings
});
