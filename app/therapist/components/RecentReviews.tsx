import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../../../contexts/TherapistContext';
import { TherapistReview } from '../types';

export default function RecentReviews() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getReviews } = useTherapist();
  const [reviews, setReviews] = useState<TherapistReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadRecentReviews();
  }, []);

  const loadRecentReviews = async () => {
    try {
      const data = await getReviews();
      const recentReviews = data.slice(0, 5); // Show only 5 most recent
      setReviews(recentReviews);
      
      // Calculate average rating
      if (data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const getClientName = (review: TherapistReview) => {
    const client = review.client as any;
    return review.is_anonymous ? 'Anonymous' : client?.full_name || 'Patient';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewAll = () => {
    console.log('View all reviews');
  };

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.title, isDark && styles.darkText]}>Recent Reviews</Text>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkSubText]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Recent Reviews</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {reviews.length > 0 && (
        <View style={[styles.ratingOverview, isDark && styles.darkCard]}>
          <View style={styles.ratingDisplay}>
            <Text style={[styles.ratingValue, isDark && styles.darkText]}>
              {averageRating.toFixed(1)}
            </Text>
            <View style={styles.starsContainer}>
              {renderStars(Math.floor(averageRating), 20)}
            </View>
          </View>
          <Text style={[styles.reviewCount, isDark && styles.darkSubText]}>
            Based on {reviews.length} recent reviews
          </Text>
        </View>
      )}

      {reviews.length > 0 ? (
        <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
          {reviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, isDark && styles.darkCard]}>
              <View style={styles.reviewHeader}>
                <View style={styles.clientInfo}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitial}>
                      {getClientName(review)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={[styles.clientName, isDark && styles.darkText]}>
                      {getClientName(review)}
                    </Text>
                    <Text style={[styles.reviewDate, isDark && styles.darkSubText]}>
                      {formatDate(review.created_at)}
                    </Text>
                  </View>
                </View>
                <View style={styles.starsContainer}>
                  {renderStars(review.rating)}
                </View>
              </View>

              {review.review_text && (
                <Text style={[styles.reviewText, isDark && styles.darkSubText]} numberOfLines={3}>
                  {review.review_text}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={48} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.emptyText, isDark && styles.darkSubText]}>
            No reviews yet
          </Text>
          <Text style={[styles.emptySubText, isDark && styles.darkSubText]}>
            Reviews from your patients will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  darkContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  viewAllText: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  ratingOverview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  reviewsList: {
    maxHeight: 400,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitial: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  clientDetails: {
    gap: 2,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Vercetti-Regular',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
}); 