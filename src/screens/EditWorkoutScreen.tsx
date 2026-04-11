import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../styles/theme';
import { loadWorkouts, saveWorkouts } from '../utils/storage';
import type { Workout } from '../types';

export function EditWorkoutScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  const { workout } = route.params;

  const [sets, setSets] = useState(workout.sets);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ SAFE HELPER (handles old + new data)
  const getExercisesSafe = (w: any) => {
    return w.exercises ?? [
      {
        id: w.id,
        name: w.exercise,
        muscleGroup: w.muscleGroup,
        sets: w.sets,
      },
    ];
  };

  const updateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const updated = [...sets];
    updated[index][field] = Number(value);
    setSets(updated);
  };

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_: any, i: number) => i !== index));
  };

  // 🔥 UPDATE EXERCISE INSIDE WORKOUT
  const handleSave = async () => {
    const workouts = await loadWorkouts();

    const updatedWorkouts = workouts.map((w: Workout) => {
      if (w.id !== workout.workoutId) return w;

      return {
        ...w,
        exercises: w.exercises.map((ex) =>
          ex.name === workout.exercise
            ? { ...ex, sets }
            : ex
        ),
      };
    });

    await saveWorkouts(updatedWorkouts);
    navigation.goBack();
  };

  const handleDelete = async () => {
    Alert.alert('Delete Exercise', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const workouts = await loadWorkouts();

          const updatedWorkouts = workouts
            .map((w: Workout) => {
              if (w.id !== workout.workoutId) return w;

              const updatedExercises = w.exercises.filter(
                (ex) => ex.name !== workout.exercise // ✅ FIX
              );

              return {
                ...w,
                exercises: updatedExercises,
              };
            })
            // remove workout if no exercises left
            .filter((w) => w.exercises.length > 0);

          await saveWorkouts(updatedWorkouts);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      setSets(workout.sets);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.accent}
          colors={[COLORS.accent]}
          progressBackgroundColor={COLORS.surface}
        />
      }
    >
      <Text style={styles.title}>{workout.exercise}</Text>

      {sets.map((set: any, i: number) => (
        <View key={i} style={styles.row}>
          <TextInput
            style={styles.input}
            value={String(set.reps)}
            keyboardType="numeric"
            onChangeText={(v) => updateSet(i, 'reps', v)}
          />

          <TextInput
            style={styles.input}
            value={String(set.weight)}
            keyboardType="numeric"
            onChangeText={(v) => updateSet(i, 'weight', v)}
          />

          <Pressable onPress={() => removeSet(i)}>
            <Text style={{ color: 'red' }}>✕</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={addSet}>
        <Text style={styles.add}>+ Add Set</Text>
      </Pressable>

      <Pressable style={styles.delete} onPress={handleDelete}>
        <Text style={{ color: '#fff' }}>Delete Exercise</Text>
      </Pressable>

      <Pressable style={styles.save} onPress={handleSave}>
        <Text style={{ color: '#fff' }}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 6,
    color: COLORS.text,
  },

  add: {
    color: COLORS.accent,
    marginTop: 10,
  },

  save: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 8,
  },

  delete: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
  },
});
