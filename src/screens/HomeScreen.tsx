import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { WorkoutCard } from '../components/WorkoutCard';
import { FAB } from '../components/FAB';
import {
  loadWorkouts,
  loadBodyweight,
  addBodyweight,
  loadDayLogs,
  saveDayLogs,
} from '../utils/storage';

import { COLORS, globalStyles, SPACING, RADIUS } from '../styles/theme';
import type { Workout, MuscleGroup, DayLog } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Core',
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyweight, setBodyweight] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [weightInput, setWeightInput] = useState('');

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const navigation = useNavigation<NavigationProp>();

  const fetchData = async () => {
    const w = await loadWorkouts();
    const bw = await loadBodyweight();
    const lg = await loadDayLogs();

    setWorkouts(w);
    setBodyweight(bw);
    setLogs(lg);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // 🔥 REST DAY
  const addRestDay = async () => {
    const today = new Date().toISOString().split('T')[0];

    const existingLogs = await loadDayLogs();
    const workouts = await loadWorkouts();

    // ❌ check if workout exists today
    const hasWorkout = workouts.some(
      w => w.date.split('T')[0] === today
    );

    if (hasWorkout) {
      alert('You already logged a workout today');
      return;
    }

    // ❌ check if rest already exists
    const hasRest = existingLogs.some(
      log =>
        log.type === 'rest' &&
        log.date.split('T')[0] === today
    );

    if (hasRest) {
      alert('Rest day already logged');
      return;
    }

    // ✅ add rest
    const newLog: DayLog = {
      date: new Date().toISOString(),
      type: 'rest',
    };

    await saveDayLogs([newLog, ...existingLogs]);

    fetchData(); // refresh
  };

  // 🔥 BODYWEIGHT
  const handleAddWeight = async () => {
    if (!weightInput) return;

    await addBodyweight(Number(weightInput));
    setWeightInput('');
    fetchData();
  };

  // 🔥 CALENDAR DOTS (WORKOUT + REST)
  const markedDates = useMemo(() => {
    const marked: any = {};

    // workouts
    workouts.forEach(w => {
      const date = w.date.split('T')[0];

      if (!marked[date]) marked[date] = { dots: [] };

      const uniqueMuscles = [
        ...new Set(w.exercises.map(ex => ex.muscleGroup)),
      ];

      uniqueMuscles.forEach(muscle => {
        const exists = marked[date].dots.some((d: any) => d.key === muscle);

        if (!exists) {
          marked[date].dots.push({
            key: muscle,
            color: COLORS.muscleGroups[muscle],
          });
        }
      });
    });

    // rest days
    logs.forEach(log => {
      if (log.type === 'rest') {
        const date = log.date.split('T')[0];

        if (!marked[date]) marked[date] = { dots: [] };

        marked[date].dots.push({
          key: 'rest',
          color: '#9E9E9E',
        });
      }
    });

    // selected
    if (!marked[selectedDate]) marked[selectedDate] = { dots: [] };

    marked[selectedDate].selected = true;
    marked[selectedDate].selectedColor = COLORS.accent;

    return marked;
  }, [workouts, logs, selectedDate]);

  const selectedDateWorkouts = workouts.filter(
    w => w.date.split('T')[0] === selectedDate
  );

  const filteredWorkouts =
    selectedMuscle === 'All'
      ? selectedDateWorkouts
      : selectedDateWorkouts.filter(w =>
          w.exercises.some(ex => ex.muscleGroup === selectedMuscle)
        );

  const latestWeight = bodyweight[0]?.weight;

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="dumbbell" size={24} color="white" />
          </View>

          <View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={globalStyles.title}>Workout Tracker</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.progressBtn}
          onPress={() => navigation.navigate('Progress')}
        >
          <MaterialCommunityIcons
            name="chart-bar"
            size={24}
            color={COLORS.accent}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(w, i) => `${w.id}-${i}`}
        ListHeaderComponent={
          <>
            {/* 🔥 BODYWEIGHT */}
            <View style={styles.weightCard}>
              <Text style={styles.weightTitle}>Bodyweight</Text>

              <Text style={styles.weightValue}>
                {latestWeight ? `${latestWeight} kg` : 'No data'}
              </Text>

              <View style={styles.weightInputRow}>
                <TextInput
                  placeholder="Enter weight"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleAddWeight}
                >
                  <Text style={{ color: '#000' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🔥 REST BUTTON */}
            <TouchableOpacity
              style={styles.restBtn}
              onPress={addRestDay}
              activeOpacity={0.7}
            >
              <Text style={styles.restBtnText}>Rest Day</Text>
            </TouchableOpacity>

            {/* 📅 CALENDAR */}
            <View style={styles.calendarWrapper}>
              <Calendar
                current={selectedDate}
                markingType="multi-dot"
                markedDates={markedDates}
                onDayPress={d => setSelectedDate(d.dateString)}
                theme={{
                  backgroundColor: COLORS.background,
                  calendarBackground: COLORS.surface,
                  dayTextColor: COLORS.text,
                  monthTextColor: COLORS.text,
                  selectedDayBackgroundColor: COLORS.accent,
                  todayTextColor: COLORS.accent,
                }}
              />
            </View>
          </>
        }
        renderItem={({ item }) => (
          <WorkoutCard workout={item} showDate={false} />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40 }}>
            No workouts
          </Text>
        }
      />

      <FAB onPress={() => navigation.navigate('Add')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  filtersWrapper: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Space for FAB
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  calendarWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  dateInfoWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },

weightCard: {
  backgroundColor: COLORS.surface,
  marginHorizontal: SPACING.lg,
  marginBottom: SPACING.md,
  padding: SPACING.md,
  borderRadius: RADIUS.lg,
},

weightTitle: {
  fontSize: 14,
  color: COLORS.textSecondary,
  marginBottom: 4,
},

weightValue: {
  fontSize: 26,
  fontWeight: 'bold',
  color: COLORS.accent,
},

weightInputRow: {
  flexDirection: 'row',
  gap: 10,
},

input: {
  flex: 1,
  backgroundColor: '#1E1E1E',
  padding: 10,
  borderRadius: 8,
  color: COLORS.text,
},

saveBtn: {
  backgroundColor: COLORS.accent,
  paddingHorizontal: 16,
  justifyContent: 'center',
  borderRadius: 8,
},

restBtn: {
  marginHorizontal: SPACING.lg,
  marginBottom: SPACING.md,
  backgroundColor: '#1E1E1E',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#9E9E9E',
},

restBtnText: {
  color: '#9E9E9E',
  fontWeight: '600',
  fontSize: 16,
},

});
