import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/theme';
import type { Workout } from '../types';

type Props = {
  workout: Workout;
  showDate?: boolean;
};

export function WorkoutCard({ workout, showDate = true }: Props) {
  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  );
  const muscleGroups = [...new Set(workout.exercises.map(ex => ex.muscleGroup))];

  return (
    <View style={styles.card}>
      
      {showDate && (
        <Text style={styles.date}>
          {new Date(workout.date).toDateString()}
        </Text>
      )}

      {workout.exercises.map((ex, exIndex) => (
        <View key={exIndex} style={styles.exerciseContainer}>
          <Text style={styles.exercise}>{ex.name} ({ex.muscleGroup})</Text>
          <View style={styles.setsContainer}>
            {ex.sets.map((set, index) => (
              <Text key={`set-${index}`} style={styles.set}>
                {set.reps} × {set.weight}kg
              </Text>
            ))}
          </View>
        </View>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },

  exerciseContainer: {
    marginBottom: SPACING.sm,
  },

  exercise: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  muscle: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },

  setsContainer: {
    marginTop: 6,
  },

  set: {
    color: COLORS.text,
    fontSize: 14,
  },
});
