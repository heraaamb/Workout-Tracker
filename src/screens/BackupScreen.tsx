import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { loadWorkouts, saveWorkouts, getExercises, saveExercises, loadBodyweight, saveBodyweight } from '../utils/storage';

export default function BackupScreen() {

  // 🔥 EXPORT
  const handleExport = async () => {
    try {
      const workouts = await loadWorkouts();
      const exercises = await getExercises();
      const weights = await loadBodyweight();
      const data = {
        weights,
        workouts,
        exercises,
        exportedAt: new Date().toISOString(),
      };

      const fileUri = FileSystem.documentDirectory + 'workout-backup.json';

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2)
      );

      await Sharing.shareAsync(fileUri);

    } catch (err) {
      console.error(err);
      Alert.alert('Export failed');
    }
  };

  // 🔥 IMPORT
  const handleImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (res.canceled) return;

      const fileUri = res.assets[0].uri;

      const content = await FileSystem.readAsStringAsync(fileUri);
      const parsed = JSON.parse(content);

      if (!parsed.workouts || !parsed.exercises) {
        Alert.alert('Invalid backup file');
        return;
      }

      Alert.alert(
        'Restore Backup',
        'This will overwrite current data',
        [
          { text: 'Cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              await saveWorkouts(parsed.workouts);
              await saveExercises(parsed.exercises);
              await saveBodyweight(parsed.weights || []);
              Alert.alert('Backup restored ✅');
            },
          },
        ]
      );

    } catch (err) {
      console.error(err);
      Alert.alert('Import failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backup & Restore</Text>

      <Pressable style={styles.btn} onPress={handleExport}>
        <Text style={styles.btnText}>Export Data</Text>
      </Pressable>

      <Pressable style={[styles.btn, { backgroundColor: '#FF5252' }]} onPress={handleImport}>
        <Text style={styles.btnText}>Import Data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  btnText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});