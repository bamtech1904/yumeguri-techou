import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bath, Star, Clock, MapPin } from 'lucide-react-native';
import { Visit } from '@/store/visitStore';

interface VisitCardProps {
  visit: Visit;
  onPress?: () => void;
}

export default function VisitCard({ visit, onPress }: VisitCardProps) {
  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Bath size={20} color="#0ea5e9" />
        <Text style={styles.name}>{visit.bathName}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.timeContainer}>
          <Clock size={16} color="#64748b" />
          <Text style={styles.time}>{visit.visitTime}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          {renderStars(visit.rating)}
          <Text style={styles.ratingText}>{visit.rating}</Text>
        </View>
      </View>
      
      {visit.address && (
        <View style={styles.addressContainer}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.address}>{visit.address}</Text>
        </View>
      )}
      
      {visit.comment && (
        <Text style={styles.comment}>{visit.comment}</Text>
      )}
      
      <Text style={styles.date}>{visit.date}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    flex: 1,
  },
  comment: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
});