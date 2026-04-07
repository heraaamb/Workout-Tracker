import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  Pressable
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getExercises, loadDayLogs, loadWorkouts, saveDayLogs, saveExercise, saveWorkouts } from '../utils/storage';
import { EXERCISES_BY_MUSCLE } from '../types';
import { COLORS, globalStyles, SPACING, RADIUS } from '../styles/theme';
import type { MuscleGroup, WorkoutSet, WorkoutExercise, Workout, DayLog } from '../types';
import type { StoredExercise } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

// SAME IMPORTS (keep yours)

export function AddWorkoutScreen() {
  const navigation = useNavigation();

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>('');
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([{ reps: 0, weight: 0 }]);

  const [exerciseList, setExerciseList] = useState<StoredExercise[]>([]);
  const [newExercise, setNewExercise] = useState('');

  useFocusEffect(
    useCallback(() => {
      getExercises().then(setExerciseList);
    }, [])
  );

  const handleAddSet = () => {
    setSets(prev => [...prev, { reps: 0, weight: 0 }]);
  };

  const handleSetChange = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...sets];
    const parsed = value === '' ? 0 : parseFloat(value);
    newSets[index][field] = isNaN(parsed) ? 0 : parsed;
    setSets(newSets);
  };

  const handleAddExerciseToWorkout = () => {
    if (!muscleGroup || !exercise || sets.some(s => s.reps === 0 || s.weight === 0)) return;

    setWorkoutExercises(prev => [
      ...prev,
      { name: exercise, muscleGroup, sets }
    ]);

    setExercise('');
    setSets([{ reps: 0, weight: 0 }]);
  };

  const handleSave = async () => {
    if (workoutExercises.length === 0) return;

    const newWorkout: Workout = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: workoutExercises,
    };

    const existing = await loadWorkouts();
    await saveWorkouts([newWorkout, ...existing]);

    navigation.goBack();
  };

  const availableExercises = muscleGroup
  ? [
      ...(EXERCISES_BY_MUSCLE[muscleGroup] || []),
      ...exerciseList
        .filter(ex => ex.muscleGroup === muscleGroup)
        .map(ex => ex.name),
    ]
  : [];

  const uniqueExercises = [...new Set(availableExercises)];

  const isExerciseValid =
    muscleGroup !== '' &&
    exercise !== '' &&
    sets.every(s => s.reps > 0 && s.weight > 0);


  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.headerTitle}>Build Workout</Text>

        {/* MUSCLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle</Text>
          
          <View style={styles.pillRow}>
            {MUSCLE_GROUPS.map(m => (
              <Pressable
                key={m}
                style={[
                  styles.pill,
                  muscleGroup === m && {
                    backgroundColor: COLORS.muscleGroups[m],
                    borderColor: COLORS.muscleGroups[m],
                  },
                ]}
                onPress={() => setMuscleGroup(m)}
              >
                <Text style={styles.pillText}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* EXERCISE */}
        {muscleGroup !== '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise</Text>

            <View style={styles.exerciseGrid}>
              {uniqueExercises.map((ex, i) => (
                <Pressable
                  key={`${ex}-${i}`}
                  style={[
                    styles.exerciseCard,
                    exercise === ex && styles.exerciseSelected
                  ]}
                  onPress={() => setExercise(ex)}
                >
                  <Text style={styles.exerciseText}>{ex}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SETS */}
        {exercise !== '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sets</Text>

            <View style={styles.setHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>Reps</Text>
              <Text style={styles.setHeaderText}>Weight</Text>
            </View>

            {sets.map((set, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={styles.setIndex}>{i + 1}</Text>

                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(v) => handleSetChange(i, 'reps', v)}
                />

                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(v) => handleSetChange(i, 'weight', v)}
                />
              </View>
            ))}

            <Pressable onPress={handleAddSet}>
              <Text style={styles.addSet}>+ Add Set</Text>
            </Pressable>

            <Pressable
              style={[styles.addBtn, !isExerciseValid && { opacity: 0.5 }]}
              disabled={!isExerciseValid}
              onPress={handleAddExerciseToWorkout}
            >
              <Text style={styles.addBtnText}>Add Exercise</Text>
            </Pressable>
          </View>
        )}

        {/* WORKOUT PREVIEW */}
        {workoutExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout</Text>

            {workoutExercises.map((ex, i) => (
              <View key={i} style={styles.previewCard}>
                <Text style={styles.previewTitle}>{ex.name}</Text>
                <Text style={styles.previewSub}>
                  {ex.sets.length} sets • {ex.muscleGroup}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* SAVE */}
      {workoutExercises.length > 0 && (
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save Workout</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.lg, paddingBottom: 140 },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },

  section: { marginBottom: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: COLORS.text,
  },

  muscleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  exerciseList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  exerciseButton: {
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },

  selected: {
    backgroundColor: COLORS.accent,
  },

  text: {
    color: COLORS.text,
  },

  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    color: COLORS.text,
  },

  addBtn: {
    marginTop: 10,
    backgroundColor: COLORS.accent,
    padding: 10,
    borderRadius: 8,
  },

  addBtnText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },

  setRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  addSet: {
    color: COLORS.accent,
    marginTop: 10,
  },

  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },

  exName: {
    color: COLORS.text,
    fontWeight: '600',
  },

  saveBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 10,
  },

  saveText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },

  restBtn: {
    marginTop: 12,
    backgroundColor: '#1E1E1E', // dark card style
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#9E9E9E', // subtle grey (rest color)
  },

  restBtnText: {
    color: '#9E9E9E',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },

  pillText: {
    color: '#ccc',
    fontWeight: '600',
  },

  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  exerciseCard: {
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },

  exerciseSelected: {
    backgroundColor: COLORS.accent,
  },

  exerciseText: {
    color: '#fff',
    fontWeight: '600',
  },

  setHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  setHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },

  setIndex: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },

  setInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    marginHorizontal: 4,
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    color: '#fff',
  },

  previewCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  previewTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
  },

  previewSub: {
    color: COLORS.textSecondary,
  },

});