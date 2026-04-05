import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getExercises, loadWorkouts, saveExercise, saveWorkouts } from '../utils/storage';
import { EXERCISES_BY_MUSCLE } from '../types';
import { COLORS, globalStyles, SPACING, RADIUS } from '../styles/theme';
import type { MuscleGroup, WorkoutSet, Workout } from '../types';

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

export function AddWorkoutScreen() {
  const navigation = useNavigation();

  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>('');
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([{ reps: 0, weight: 0 }]);

  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [newExercise, setNewExercise] = useState('');

  /* ---------------- LOAD EXERCISES ---------------- */

  useEffect(() => {
    getExercises().then(setExerciseList);
  }, []);

  /* ---------------- ADD CUSTOM EXERCISE ---------------- */

  const handleAddExercise = async () => {
    if (!newExercise.trim() || !muscleGroup) return;

    await saveExercise(newExercise.trim());

    const updated = await getExercises();
    setExerciseList(updated);

    setExercise(newExercise.trim());
    setNewExercise('');
  };

  /* ---------------- MERGE + DEDUP ---------------- */

  const availableExercises = muscleGroup
    ? [
        ...(EXERCISES_BY_MUSCLE[muscleGroup] || []),
        ...exerciseList,
      ]
    : [];

  const uniqueExercises = availableExercises.filter(
    (ex, index, self) => self.indexOf(ex) === index
  );

  /* ---------------- HANDLERS ---------------- */

  const handleMuscleGroupChange = (group: MuscleGroup) => {
    setMuscleGroup(group);
    setExercise('');
  };

  const handleAddSet = () => {
    setSets(prev => [...prev, { reps: 0, weight: 0 }]);
  };

  const handleSetChange = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...sets];
    const parsed = value === '' ? 0 : parseFloat(value);
    newSets[index][field] = isNaN(parsed) ? 0 : parsed;
    setSets(newSets);
  };

  const handleSave = async () => {
    if (!muscleGroup || !exercise || sets.some(s => s.reps === 0 || s.weight === 0)) return;

    const newWorkout: Workout = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      muscleGroup,
      exercise,
      sets,
    };

    const existing = await loadWorkouts();
    await saveWorkouts([newWorkout, ...existing]);

    navigation.goBack();
  };

  const isValid =
    muscleGroup !== '' &&
    exercise !== '' &&
    sets.every(s => s.reps > 0 && s.weight > 0);

  /* ---------------- UI ---------------- */

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.headerTitle}>Add Workout</Text>

        {/* MUSCLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Group</Text>

          <View style={styles.muscleGrid}>
            {MUSCLE_GROUPS.map(group => {
              const isSelected = muscleGroup === group;
              const color = COLORS.muscleGroups[group] || COLORS.accent;
              return (
                <TouchableOpacity
                  key={group}
                  onPress={() => handleMuscleGroupChange(group)}
                  style={[
                    styles.muscleButton,
                    isSelected ? { backgroundColor: `${color}20`, borderColor: color, borderWidth: 1 } : {}
                  ]}
                >
                  <Text style={[styles.text, isSelected ? { color } : {}]}>{group}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* EXERCISE */}
        {muscleGroup !== '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise</Text>

            <View style={styles.exerciseList}>
              {uniqueExercises.map((ex, index) => (
                <TouchableOpacity
                  key={`${ex}-${index}`}   // ✅ FIXED KEY
                  onPress={() => setExercise(ex)}
                  style={[
                    styles.exerciseButton,
                    exercise === ex && styles.selected
                  ]}
                >
                  <Text style={styles.text}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ADD NEW */}
            <TextInput
              placeholder="Add new exercise"
              placeholderTextColor="#888"
              value={newExercise}
              onChangeText={setNewExercise}
              style={styles.input}
            />

            <TouchableOpacity style={styles.addBtn} onPress={handleAddExercise}>
              <Text style={styles.addBtnText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SETS */}
        {exercise !== '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sets</Text>

            {sets.map((set, i) => (
              <View key={`set-${i}`} style={styles.setRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Reps"
                  placeholderTextColor={COLORS.textSecondary}
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(v) => handleSetChange(i, 'reps', v)}
                />

                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Weight"
                  placeholderTextColor={COLORS.textSecondary}
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(v) => handleSetChange(i, 'weight', v)}
                />
              </View>
            ))}

            <TouchableOpacity onPress={handleAddSet}>
              <Text style={styles.addSet}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* SAVE */}
      {exercise !== '' && (
        <TouchableOpacity
          style={[styles.saveBtn, !isValid && { opacity: 0.5 }]}
          disabled={!isValid}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>Save Workout</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.lg, paddingBottom: 120 },

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
});