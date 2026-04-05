import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../styles/theme';
import type { Workout } from '../types';

type Props = {
  workout: Workout;
  showDate?: boolean;
};

export function WorkoutCard({ workout, showDate = true }: Props) {
  return (
    <View style={styles.card}>
      
      {/* ✅ NEVER render full object */}
      <Text style={styles.exercise}>{workout.exercise}</Text>
      <Text style={styles.muscle}>{workout.muscleGroup}</Text>

      {showDate && (
        <Text style={styles.date}>
          {new Date(workout.date).toDateString()}
        </Text>
      )}

      {/* ✅ Render sets properly */}
      <View style={styles.setsContainer}>
        {workout.sets.map((set, index) => (
          <Text key={`set-${index}`} style={styles.set}>
            {set.reps} × {set.weight}kg
          </Text>
        ))}
      </View>

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