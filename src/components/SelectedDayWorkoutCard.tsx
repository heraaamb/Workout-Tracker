import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/theme';
import type { Workout } from '../types';

type Props = {
  workout: Workout;
  index: number;
};

export function SelectedDayWorkoutCard({ workout, index }: Props) {
  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sessionLabel}>Session {index + 1}</Text>
          <Text style={styles.sessionTitle}>
            {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.summaryBadge}>
          <MaterialCommunityIcons
            name="repeat"
            size={14}
            color={COLORS.accent}
          />
          <Text style={styles.summaryBadgeText}>{setCount} sets</Text>
        </View>
      </View>

      <View style={styles.exerciseList}>
        {workout.exercises.map((exercise, exerciseIndex) => (
          <View key={`${exercise.name}-${exerciseIndex}`} style={styles.exerciseRow}>
            <View style={styles.exerciseMain}>
              <View
                style={[
                  styles.exerciseDot,
                  { backgroundColor: COLORS.muscleGroups[exercise.muscleGroup] },
                ]}
              />
              <View style={styles.exerciseTextWrap}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.muscleGroup} · {exercise.sets.length} set
                  {exercise.sets.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <View style={styles.setChips}>
              {exercise.sets.map((set, setIndex) => (
                <View key={`${exerciseIndex}-${setIndex}`} style={styles.setChip}>
                  <Text style={styles.setChipText}>
                    {set.reps} x {set.weight}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sessionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sessionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
  },
  summaryBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseList: {
    gap: SPACING.sm,
  },
  exerciseRow: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 10,
  },
  exerciseMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
  },
  exerciseTextWrap: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  setChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  setChipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
