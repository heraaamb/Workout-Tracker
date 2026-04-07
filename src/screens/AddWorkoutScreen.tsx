import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';

import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';

import {
  getExercises,
  loadWorkouts,
  saveWorkouts
} from '../utils/storage';

import { EXERCISES_BY_MUSCLE } from '../types';
import { COLORS, globalStyles, RADIUS, SPACING } from '../styles/theme';

import type {
  MuscleGroup,
  WorkoutSet,
  WorkoutExercise,
  Workout,
  StoredExercise
} from '../types';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'
];

export function AddWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  // ✅ FIXED DATE HANDLING
  const initialDate = route.params?.date
    ? new Date(route.params.date)
    : new Date();

  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);  
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showPicker, setShowPicker] = useState(false);

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>('');
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([{ reps: 0, weight: 0 }]);

  const [exerciseList, setExerciseList] = useState<StoredExercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      getExercises().then(setExerciseList);
    }, [])
  );

  // 🔥 LOAD EXISTING WORKOUT
  useEffect(() => {
    const loadExisting = async () => {
      const workouts = await loadWorkouts();

      const found = workouts.find(w =>
        new Date(w.date).toDateString() === selectedDate.toDateString()
      );

      if (found) {
        setWorkoutExercises(found.exercises);
        setEditingWorkoutId(found.id);
      }
    };

    loadExisting();
  }, []);

  // 🔥 SET HANDLERS
  const handleAddSet = () => {
    setSets(prev => [...prev, { reps: 0, weight: 0 }]);
  };

  const handleSetChange = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...sets];
    const parsed = value === '' ? 0 : parseFloat(value);
    newSets[index][field] = isNaN(parsed) ? 0 : parsed;
    setSets(newSets);
  };

  const handleDeleteSet = (index: number) => {
    setSets(prev => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const renderRightActions = (index: number) => (
    <Pressable
      onPress={() => handleDeleteSet(index)}
      style={styles.deleteSwipe}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  const handleAddExerciseToWorkout = () => {
    if (!muscleGroup || !exercise || sets.some(s => s.reps === 0 || s.weight === 0)) return;

    if (editingExerciseIndex !== null) {
      // 🔥 UPDATE EXISTING
      setWorkoutExercises(prev =>
        prev.map((ex, i) =>
          i === editingExerciseIndex
            ? { name: exercise, muscleGroup, sets }
            : ex
        )
      );

      setEditingExerciseIndex(null);
    } else {
      // 🔥 ADD NEW
      setWorkoutExercises(prev => [
        ...prev,
        { name: exercise, muscleGroup, sets }
      ]);
    }

    // reset form
    setExercise('');
    setSets([{ reps: 0, weight: 0 }]);
  };

  // 🔥 DELETE WORKOUT
  const handleDelete = async () => {
    Alert.alert('Delete Workout', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const workouts = await loadWorkouts();
          const filtered = workouts.filter(w => w.id !== editingWorkoutId);
          await saveWorkouts(filtered);
          navigation.goBack();
        }
      }
    ]);
  };

  // 🔥 SAVE
  const handleSave = async () => {
    if (workoutExercises.length === 0) return;

    const existing = await loadWorkouts();

    const sameDateWorkout = existing.find(w =>
      new Date(w.date).toDateString() === selectedDate.toDateString()
    );

    const newWorkout: Workout = {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      exercises: workoutExercises,
    };

    if (editingWorkoutId) {
      const updated = existing.map(w =>
        w.id === editingWorkoutId
          ? { ...w, exercises: workoutExercises, date: selectedDate.toISOString() }
          : w
      );

      await saveWorkouts(updated);
      navigation.goBack();
      return;
    }

    if (sameDateWorkout) {
      Alert.alert(
        'Workout Exists',
        'What do you want to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              const filtered = existing.filter(w => w.id !== sameDateWorkout.id);
              await saveWorkouts([newWorkout, ...filtered]);
              navigation.goBack();
            }
          },
          {
            text: 'Add Another',
            onPress: async () => {
              await saveWorkouts([newWorkout, ...existing]);
              navigation.goBack();
            }
          }
        ]
      );
      return;
    }

    await saveWorkouts([newWorkout, ...existing]);
    navigation.goBack();
  };

  const handleDeleteExercise = (index: number) => {
    setWorkoutExercises(prev => prev.filter((_, i) => i !== index));
  };

  const renderExerciseActions = (index: number) => (
    <Pressable
      onPress={() => handleDeleteExercise(index)}
      style={styles.deleteSwipe}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  const autoSaveWorkout = async () => {
    if (workoutExercises.length === 0) return;

    const existing = await loadWorkouts();

    const newWorkout: Workout = {
      id: editingWorkoutId || Date.now().toString(),
      date: selectedDate.toISOString(),
      exercises: workoutExercises,
    };

    let updated;

    if (editingWorkoutId) {
      // update existing
      updated = existing.map(w =>
        w.id === editingWorkoutId ? newWorkout : w
      );
    } else {
      // create new
      updated = [newWorkout, ...existing];
    }

    await saveWorkouts(updated);
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

        <Text style={styles.headerTitle}>
          {editingWorkoutId ? 'Edit Workout' : 'Build Workout'}
        </Text>

        {/* DATE */}
        <Pressable onPress={() => setShowPicker(true)} style={styles.dateBtn}>
          <Text style={styles.dateText}>
            {selectedDate.toDateString()}
          </Text>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            onChange={async (e, newDate) => {
              setShowPicker(false);

              if (!newDate) return;

              // 🔥 SAVE CURRENT WORKOUT BEFORE SWITCH
              await autoSaveWorkout();

              // 🔥 SWITCH DATE
              setSelectedDate(newDate);

              // 🔥 LOAD WORKOUT FOR NEW DATE
              const workouts = await loadWorkouts();

              const found = workouts.find(w =>
                new Date(w.date).toDateString() === newDate.toDateString()
              );

              if (found) {
                setWorkoutExercises(found.exercises);
                setEditingWorkoutId(found.id);
              } else {
                // new blank workout
                setWorkoutExercises([]);
                setEditingWorkoutId(null);
              }
            }}
          />
        )}

        {/* CLEAR */}
        {editingWorkoutId && (
          <Pressable
            style={styles.clearBtn}
            onPress={() => {
              Alert.alert('Clear Workout', 'Remove all exercises?', [
                { text: 'Cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    setWorkoutExercises([]);
                    setEditingWorkoutId(null);
                  }
                }
              ]);
            }}
          >
            <Text style={styles.clearText}>Clear Existing Workout</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            Alert.alert('Clear All', 'Remove all exercises from this workout?', [
              { text: 'Cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: () => setWorkoutExercises([])
              }
            ]);
          }}
        >
          <Text style={styles.clearText}>Remove All Exercises</Text>
        </Pressable>

        {/* MUSCLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle</Text>

          <View style={styles.pillRow}>
            {MUSCLE_GROUPS.map(m => (
              <Pressable
                key={m}
                style={[
                  styles.pill,
                  muscleGroup === m && { backgroundColor: COLORS.muscleGroups[m] }
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
                  key={i}
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

            {sets.map((set, i) => (
              <Swipeable
                key={i}
                renderRightActions={() => renderRightActions(i)}
              >
                <View style={styles.setRow}>
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
              </Swipeable>
            ))}

            <Pressable onPress={handleAddSet}>
              <Text style={styles.addSet}>+ Add Set</Text>
            </Pressable>

            <Pressable
              style={[styles.addBtn, !isExerciseValid && { opacity: 0.5 }]}
              disabled={!isExerciseValid}
              onPress={handleAddExerciseToWorkout}
            >
              <Text style={styles.addBtnText}>
                {editingExerciseIndex !== null ? 'Update Exercise' : 'Add Exercise'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* PREVIEW */}
        {workoutExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout</Text>

            <Text style={{ color: '#888', fontSize: 12 }}>
              Long press to edit
            </Text>

            {workoutExercises.map((ex, i) => (
              <Swipeable
                key={i}
                renderRightActions={() => renderExerciseActions(i)}
              >
                <Pressable
                  onLongPress={() => {
                    setMuscleGroup(ex.muscleGroup);
                    setExercise(ex.name);
                    setSets(ex.sets);
                    setEditingExerciseIndex(i);
                  }}
                >
                  <View
                    style={[
                      styles.previewCard,
                      editingExerciseIndex === i && {
                        borderColor: COLORS.accent,
                        borderWidth: 2,
                      }
                    ]}
                  >
                    <Text style={styles.previewTitle}>{ex.name}</Text>
                    <Text style={styles.previewSub}>
                      {ex.sets.length} sets • {ex.muscleGroup}
                    </Text>
                  </View>
                </Pressable>
              </Swipeable>
            ))}
          </View>
        )}

      </ScrollView>

      {editingWorkoutId && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={{ color: 'red', textAlign: 'center' }}>Delete Workout</Text>
        </Pressable>
      )}

      {workoutExercises.length > 0 && (
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>
            {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
          </Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.lg, paddingBottom: 140 },

  deleteSwipe: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 10,
    borderRadius: 10,
  },

  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  clearBtn: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: RADIUS.lg,
    marginVertical: 10,
  },
  clearText: {
    color: 'red',
    fontWeight: '600',
    textAlign: 'center',
  },

  deleteBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },

  dateBtn: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
  },

  dateText: {
    color: COLORS.text,
    fontWeight: '600',
  },


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