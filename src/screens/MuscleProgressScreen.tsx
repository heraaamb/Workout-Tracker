import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loadWorkouts } from '../utils/storage';
import { getLastTrained, getTotalSessions, getMaxWeight, getAvgWeight, getExerciseCount } from '../utils/progressHelpers';
import { COLORS, globalStyles, RADIUS, SPACING } from '../styles/theme';
import type { Workout, MuscleGroup } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Progress'>;

export function MuscleProgressScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const data = await loadWorkouts();
        setWorkouts(data);
      };

      fetchData();
    }, [])
  );

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return 'Never';
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const renderCard = ({ item: muscle }: { item: MuscleGroup }) => {
    const lastTrained = getLastTrained(workouts, muscle);
    const sessions = getTotalSessions(workouts, muscle);
    const maxWeight = getMaxWeight(workouts, muscle);
    const avgWeight = getAvgWeight(workouts, muscle);
    const exerciseCount = getExerciseCount(workouts, muscle);

    const color = COLORS.muscleGroups[muscle] || COLORS.accent;

    const hasData = sessions > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MuscleDetail', { muscle })}
      >
        <View style={styles.cardHeader}>
          <View style={globalStyles.row}>
            <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
              <MaterialCommunityIcons name="arm-flex" size={24} color={color} />
            </View>
            <Text style={styles.muscleName}>{muscle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </View>

        {/* 🔥 STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Last</Text>
            <Text style={styles.statValue}>
              {hasData ? formatDate(lastTrained) : '-'}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statValue}>{sessions}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Top Lift</Text>
            <Text style={[styles.statValue, { color }]}>
              {hasData ? `${maxWeight} kg` : '-'}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{exerciseCount}</Text>
          </View>
        </View>

        {/* 🔥 AVG */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Avg Weight</Text>
          <Text style={[styles.progressValue, { color }]}>
            {hasData ? `${avgWeight} kg` : '-'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Strength Progress</Text>
        <Text style={styles.subtitle}>Track your real strength gains</Text>
      </View>

      <FlatList
        data={MUSCLE_GROUPS}
        keyExtractor={item => item}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  title: {
    ...globalStyles.title,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  muscleName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressContainer: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});