import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';

import { loadWorkouts } from '../utils/storage';
import {
  getExercisesForMuscle,
  getMuscleHistory,
  getExerciseHistory,
  getExercisePRs,
} from '../utils/progressHelpers';

import { COLORS, globalStyles, SPACING, RADIUS } from '../styles/theme';

import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import type { Workout, MuscleGroup } from '../types';

type MuscleDetailRouteProp = RouteProp<RootStackParamList, 'MuscleDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function MuscleDetailScreen() {
  const route = useRoute<MuscleDetailRouteProp>();
  const navigation = useNavigation<NavProp>();

  const { muscle } = route.params;

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts().then(setWorkouts);
  }, []);

  const exercises = getExercisesForMuscle(workouts, muscle as MuscleGroup);

  useEffect(() => {
    if (exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(exercises[0]);
    }
  }, [exercises]);

  const exerciseHistory = selectedExercise
    ? getExerciseHistory(workouts, muscle as MuscleGroup, selectedExercise)
    : [];

  const chartData = {
    labels: exerciseHistory.map((d, i) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}-${i}`;
    }),
    data: exerciseHistory.map(d => d.weight),
  };

  const history = getMuscleHistory(workouts, muscle as MuscleGroup);
  const prs = getExercisePRs(workouts, muscle as MuscleGroup);

  const color = COLORS.muscleGroups[muscle as MuscleGroup] || COLORS.accent;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>

      {/* 🔥 EXERCISE SELECTOR */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
        {exercises.map((ex, index) => (
          <Text
            key={`${ex}-${index}`} // ✅ FIXED
            onPress={() => setSelectedExercise(ex)}
            style={[
              styles.selectorItem,
              {
                backgroundColor: selectedExercise === ex ? color : '#333',
              },
            ]}
          >
            {ex}
          </Text>
        ))}
      </ScrollView>

      {/* 🔥 GRAPH */}
      <Text style={styles.sectionTitle}>
        {selectedExercise || 'Select Exercise'} Progress
      </Text>

      <View style={styles.chartWrapper}>
        <LineChart
          data={{
            labels: chartData.labels.length ? chartData.labels : ['N/A'],
            datasets: [{ data: chartData.data.length ? chartData.data : [0] }],
          }}
          width={Dimensions.get('window').width - SPACING.lg * 2}
          height={220}
          yAxisSuffix="kg"
          chartConfig={{
            backgroundColor: COLORS.surface,
            backgroundGradientFrom: COLORS.surface,
            backgroundGradientTo: COLORS.surface,
            decimalPlaces: 0,
            color: () => color,
            labelColor: () => COLORS.textSecondary,
            style: { borderRadius: RADIUS.md },
          }}
          bezier
        />
      </View>

      {/* 🔥 PR DISPLAY */}
      <View style={styles.prBox}>
        <Text style={styles.prLabel}>Exercise PRs</Text>

        {Object.entries(prs).length === 0 ? (
          <Text style={styles.prValue}>No data</Text>
        ) : (
          Object.entries(prs).map(([name, weight], index) => (
            <View key={`${name}-${index}`} style={styles.prRow}>
              <Text style={styles.prName}>{name}</Text>
              <Text style={[styles.prValue, { color }]}>{weight} kg</Text>
            </View>
          ))
        )}
      </View>

      {/* 🔥 HISTORY */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>
        Session History
      </Text>

      {history.map((day, idx) => (
        <View key={`day-${idx}`} style={styles.historyCard}>
          <Text style={styles.historyDate}>
            {new Date(day.date).toDateString()}
          </Text>

          <Text style={[styles.dayMax, { color }]}>
            Max: {day.maxWeight} kg
          </Text>

          {day.exercises.map((ex, exIdx) => (
            <View key={`ex-${exIdx}`} style={styles.exContainer}>
              <Text style={styles.exName}>{ex.name}</Text>

              <View style={styles.setRow}>
                {ex.sets.map((set, i) => (
                  <Text key={`set-${i}`} style={styles.setChip}>
                    {set.reps}×{set.weight}
                  </Text>
                ))}
              </View>

              <Text
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('EditWorkout', {
                    workout: {
                      id: ex.id,
                      date: day.date,
                      muscleGroup: muscle as MuscleGroup,
                      exercise: ex.name,
                      sets: ex.sets,
                    },
                  })
                }
              >
                Edit
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.lg, paddingTop: 100 },

  selector: {
    marginBottom: 10,
  },

  selectorItem: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    color: 'white',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  chartWrapper: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },

  prBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },

  prLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  prValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  prName: {
    color: COLORS.text,
    fontSize: 14,
  },

  historyCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
  },

  historyDate: {
    color: COLORS.text,
    marginBottom: 6,
  },

  dayMax: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  exContainer: {
    marginBottom: 10,
  },

  exName: {
    color: COLORS.text,
    fontWeight: '600',
  },

  setRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  setChip: {
    backgroundColor: COLORS.background,
    padding: 6,
    borderRadius: 6,
    color: COLORS.text,
  },

  editButton: {
    color: COLORS.accent,
    marginTop: 4,
  },
});