import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../styles/theme';
import { loadWorkouts } from '../utils/storage';
import { updateWorkout, deleteWorkout } from '../utils/storage';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import type { Workout } from '../types';


export function EditWorkoutScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  const { workout } = route.params;

  const [sets, setSets] = useState(workout.sets);

  const updateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const updated = [...sets];
    updated[index][field] = Number(value);
    setSets(updated);
  };

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_: any, i: any) => i !== index));
  };

  const handleSave = async () => {
    await updateWorkout({
      ...workout,
      sets,
    });

    navigation.goBack();
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(workout.id);
            navigation.goBack(); // ← THIS triggers refresh
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{workout.exercise}</Text>

      {sets.map((set: any, i: any) => (
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
        <Text style={{ color: '#fff' }}>Delete Workout</Text>
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