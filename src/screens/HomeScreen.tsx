import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { WorkoutCard } from '../components/WorkoutCard';
import { FAB } from '../components/FAB';
import { loadWorkouts } from '../utils/storage';
import { COLORS, globalStyles, SPACING, RADIUS } from '../styles/theme';
import type { Workout, MuscleGroup } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const navigation = useNavigation<NavigationProp>();

  const fetchWorkouts = async () => {
    const data = await loadWorkouts();
    setWorkouts(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const todayStr = new Date().toDateString();
  const todayWorkouts = workouts.filter(w => new Date(w.date).toDateString() === todayStr);

  const filteredWorkouts = selectedMuscle === 'All'
    ? todayWorkouts
    : todayWorkouts.filter(w => w.muscleGroup === selectedMuscle);

  const FilterPills = () => (
    <View style={styles.filtersWrapper}>
      <Text style={styles.sectionTitle}>Today's Muscle Group</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['All', ...MUSCLE_GROUPS] as ('All' | MuscleGroup)[]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isSelected = item === selectedMuscle;
          const color = item === 'All' ? COLORS.accent : (COLORS.muscleGroups[item] || COLORS.textSecondary);
          return (
            <TouchableOpacity
              style={[
                styles.pill,
                isSelected ? { backgroundColor: `${color}20`, borderColor: color } : {}
              ]}
              onPress={() => setSelectedMuscle(item)}
            >
              <Text style={[styles.pillText, isSelected ? { color } : {}]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.filtersContent}
      />
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="dumbbell" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={globalStyles.title}>Workout Tracker</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.progressBtn}
          onPress={() => navigation.navigate('MuscleProgress' as any)}
        >
          <MaterialCommunityIcons name="chart-bar" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(w, index) => `${w.id}-${index}`}
        ListHeaderComponent={todayWorkouts.length > 0 ? FilterPills : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyText}>No workouts recorded today</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <WorkoutCard workout={item} showDate={false} />
        )}
        contentContainerStyle={styles.listContent}
      />

      <FAB onPress={() => navigation.navigate('AddWorkout')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  filtersWrapper: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Space for FAB
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
