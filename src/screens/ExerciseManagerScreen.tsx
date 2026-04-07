import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  FlatList, Pressable, Alert
} from 'react-native';

import { Swipeable } from 'react-native-gesture-handler';

import {
  getExercises,
  saveExercise,
  deleteExercise
} from '../utils/storage';

import { EXERCISES_BY_MUSCLE } from '../types';
import { COLORS, SPACING, RADIUS } from '../styles/theme';
import type { MuscleGroup } from '../types';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest','Back','Legs','Shoulders','Biceps','Triceps','Core'
];

type StoredExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  favorite?: boolean;
};

export function ExerciseManagerScreen() {
  const [exercises, setExercises] = useState<StoredExercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('Chest');
  const [newExercise, setNewExercise] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const load = async () => {
    const data = await getExercises();
    setExercises(data);
  };

  useEffect(() => {
    load();
  }, []);

  // 🔥 MERGE DEFAULT + USER
  const list = useMemo(() => {
    const defaults = EXERCISES_BY_MUSCLE[selectedMuscle] || [];

    const user = exercises
      .filter(e => e.muscleGroup === selectedMuscle)
      .map(e => e.name);

    const merged = [...defaults, ...user];

    return [...new Set(merged)].filter(e =>
      e.toLowerCase().includes(search.toLowerCase())
    );
  }, [exercises, selectedMuscle, search]);

  const isDefault = (name: string) =>
    (EXERCISES_BY_MUSCLE[selectedMuscle] || []).includes(name);

  const handleAdd = async () => {
    if (!newExercise.trim()) return;

    await saveExercise(newExercise, selectedMuscle);

    setExercises(prev => [
      ...prev,
      { name: newExercise, muscleGroup: selectedMuscle }
    ]);

    setNewExercise('');
  };

  const handleDelete = async (name: string) => {
    await deleteExercise(name, selectedMuscle);

    setExercises(prev =>
      prev.filter(e => !(e.name === name && e.muscleGroup === selectedMuscle))
    );
  };

  const handleEdit = async (oldName: string, newName: string) => {
    if (!newName.trim()) return;

    await deleteExercise(oldName, selectedMuscle);
    await saveExercise(newName, selectedMuscle);

    load();
    setEditing(null);
  };

  const renderRightActions = (name: string) =>
    !isDefault(name) && (
      <Pressable style={styles.deleteBtn} onPress={() => handleDelete(name)}>
        <Text style={{ color: '#fff' }}>Delete</Text>
      </Pressable>
    );

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Exercises</Text>

      {/* SEARCH */}
      <TextInput
        placeholder="Search..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* MUSCLE FILTER */}
      <View style={styles.pillRow}>
        {MUSCLE_GROUPS.map(m => (
          <Pressable
            key={m}
            onPress={() => setSelectedMuscle(m)}
            style={[
              styles.pill,
              selectedMuscle === m && {
                backgroundColor: COLORS.muscleGroups[m],
                borderColor: COLORS.muscleGroups[m],
              }
            ]}
          >
            <Text style={styles.pillText}>{m}</Text>
          </Pressable>
        ))}
      </View>

      {/* ADD */}
      <View style={styles.addRow}>
        <TextInput
          placeholder="New Exercise"
          placeholderTextColor="#888"
          value={newExercise}
          onChangeText={setNewExercise}
          style={styles.input}
        />

        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Text style={{ fontWeight: 'bold' }}>+</Text>
        </Pressable>
      </View>

      {/* LIST */}
      <FlatList
        data={list}
        keyExtractor={(item, i) => item + i}
        renderItem={({ item }) => {
          const defaultItem = isDefault(item);

          return (
            <Swipeable renderRightActions={() => renderRightActions(item)}>
              <View style={styles.card}>

                {editing === item ? (
                  <TextInput
                    style={styles.input}
                    defaultValue={item}
                    autoFocus
                    onSubmitEditing={(e) =>
                      handleEdit(item, e.nativeEvent.text)
                    }
                  />
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>{item}</Text>

                    {defaultItem && (
                      <Text style={styles.defaultTag}>default</Text>
                    )}
                  </View>
                )}

                {!defaultItem && editing !== item && (
                  <Pressable onPress={() => setEditing(item)}>
                    <Text style={styles.edit}>Edit</Text>
                  </Pressable>
                )}

              </View>
            </Swipeable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  delete: {
    color: 'red',
    marginLeft: 10,
    fontWeight: '600',
  },

  defaultTag: {
    fontSize: 12,
    color: '#888',
  },

    edit: {
    color: COLORS.accent,
    marginLeft: 10,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    },

    title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    },

    search: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    color: '#fff',
    },

    pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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

    addRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    },

    input: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 10,
    color: '#fff',
    },

    addBtn: {
    backgroundColor: COLORS.accent,
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    },

    card: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    },

    text: {
    color: COLORS.text,
    fontSize: 16,
    },

    deleteBtn: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 10,
    },

    empty: {
        textAlign: 'center',
        marginTop: 30,
        color: COLORS.textSecondary,
    },
});