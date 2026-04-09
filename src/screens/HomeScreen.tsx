import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { SelectedDayWorkoutCard } from '../components/SelectedDayWorkoutCard';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';


const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyweight, setBodyweight] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [weightInput, setWeightInput] = useState('');

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');

  // ✅ keep as string (calendar format)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-CA')
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


  const handleDayLongPress = (day: any) => {
    const date = day.dateString;

    const dayWorkouts = workouts.filter(
      w => w.date.split('T')[0] === date
    );

    if (dayWorkouts.length > 0) {
      // 🔥 HAS WORKOUT → EDIT OPTION
      Alert.alert(
        'Workout Options',
        `You have ${dayWorkouts.length} workout(s) on this day`,
        [
          {
            text: 'Edit Workout',
            onPress: () =>
              navigation.navigate('Add', { date }),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // 🔥 NO WORKOUT → ADD OPTION
      Alert.alert(
        'No workout',
        'Do you want to add a workout for this day?',
        [
          {
            text: 'Add Workout',
            onPress: () =>
              navigation.navigate('Add', { date }),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // 🔥 REST DAY
  const addRestDay = async () => {
    const today = new Date().toLocaleDateString('en-CA');

    const existingLogs = await loadDayLogs();
    const workouts = await loadWorkouts();

    const hasWorkout = workouts.some(
      w => w.date.split('T')[0] === today
    );

    if (hasWorkout) {
      alert('You already logged a workout today');
      return;
    }

    const hasRest = existingLogs.some(
      log =>
        log.type === 'rest' &&
        log.date.split('T')[0] === today
    );

    if (hasRest) {
      alert('Rest day already logged');
      return;
    }

    const newLog: DayLog = {
      date: new Date().toLocaleDateString('en-CA'),
      type: 'rest',
    };

    await saveDayLogs([newLog, ...existingLogs]);
    fetchData();
  };

  // 🔥 BODYWEIGHT
  const handleAddWeight = async () => {
    if (!weightInput) return;

    await addBodyweight(Number(weightInput));
    setWeightInput('');
    fetchData();
  };

  // 🔥 CALENDAR MARKING
  const markedDates = useMemo(() => {
    const marked: any = {};

    workouts.forEach(w => {
      const date = w.date.split('T')[0];

      if (!marked[date]) marked[date] = { dots: [] };

      const uniqueMuscles = [
        ...new Set(w.exercises.map(ex => ex.muscleGroup)),
      ];

      uniqueMuscles.forEach(muscle => {
        if (!marked[date].dots.some((d: any) => d.key === muscle)) {
          marked[date].dots.push({
            key: muscle,
            color: COLORS.muscleGroups[muscle],
          });
        }
      });
    });

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

  const selectedDateLabel = useMemo(
    () =>
      new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [selectedDate]
  );

  const selectedWorkoutStats = useMemo(() => {
    const exercises = filteredWorkouts.flatMap(workout => workout.exercises);
    const muscleGroups = [...new Set(exercises.map(exercise => exercise.muscleGroup))];

    return {
      totalWorkouts: filteredWorkouts.length,
      totalExercises: exercises.length,
      muscleGroups,
    };
  }, [filteredWorkouts]);

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
          onPress={() => navigation.navigate('Performance')}
        >
          <MaterialCommunityIcons
            name="chart-bar"
            size={24}
            color={COLORS.accent}
          />
        </TouchableOpacity>
      </View>

      <Pressable onPress={() => navigation.navigate('Backup')}>
        <Text style={styles.btnText}>Backup</Text>
      </Pressable>

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(w, i) => `${w.id}-${i}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* BODYWEIGHT */}
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

            {/* REST */}
            <TouchableOpacity
              style={styles.restBtn}
              onPress={addRestDay}
            >
              <Text style={styles.restBtnText}>Rest Day</Text>
            </TouchableOpacity>

            {/* CALENDAR */}
            <View style={styles.calendarWrapper}>
              <Calendar
                current={selectedDate}
                markingType="multi-dot"
                markedDates={markedDates}
                onDayPress={d => setSelectedDate(d.dateString)}
                onDayLongPress={handleDayLongPress} // 🔥 ADD THIS


                theme={{
                  backgroundColor: '#1E1E1E',
                  calendarBackground: '#1E1E1E',

                  textSectionTitleColor: '#888', // weekdays (Mon, Tue)

                  dayTextColor: '#fff',
                  todayTextColor: COLORS.accent,
                  selectedDayTextColor: '#fff',

                  monthTextColor: '#fff',

                  arrowColor: COLORS.accent,

                  textDisabledColor: '#444',

                  dotColor: COLORS.accent,
                  selectedDotColor: '#fff',

                  indicatorColor: COLORS.accent,

                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '500',
                }}
              />
            </View>

            <View style={styles.selectedDaySection}>
              <View style={styles.selectedDayHeader}>
                <View>
                  <Text style={styles.selectedDayEyebrow}>Selected day</Text>
                  <Text style={styles.selectedDayTitle}>{selectedDateLabel}</Text>
                </View>

                <TouchableOpacity
                  style={styles.selectedDayAction}
                  onPress={() =>
                    navigation.navigate('Add', {
                      date: selectedDate,
                      existingWorkouts: selectedDateWorkouts,
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={COLORS.background}
                  />
                  <Text style={styles.selectedDayActionText}>Add</Text>
                </TouchableOpacity>
              </View>

              {selectedWorkoutStats.totalWorkouts > 0 ? (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryPill}>
                      <MaterialCommunityIcons
                        name="dumbbell"
                        size={16}
                        color={COLORS.accent}
                      />
                      <Text style={styles.summaryPillText}>
                        {selectedWorkoutStats.totalWorkouts} workout{selectedWorkoutStats.totalWorkouts === 1 ? '' : 's'}
                      </Text>
                    </View>

                    <View style={styles.summaryPill}>
                      <MaterialCommunityIcons
                        name="format-list-bulleted"
                        size={16}
                        color={COLORS.accent}
                      />
                      <Text style={styles.summaryPillText}>
                        {selectedWorkoutStats.totalExercises} exercise{selectedWorkoutStats.totalExercises === 1 ? '' : 's'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.muscleChipRow}>
                    {selectedWorkoutStats.muscleGroups.map(muscle => (
                      <View
                        key={muscle}
                        style={[
                          styles.muscleChip,
                          { borderColor: COLORS.muscleGroups[muscle] },
                        ]}
                      >
                        <View
                          style={[
                            styles.muscleChipDot,
                            { backgroundColor: COLORS.muscleGroups[muscle] },
                          ]}
                        />
                        <Text style={styles.muscleChipText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.selectedDayEmpty}>
                  <View style={styles.selectedDayEmptyIcon}>
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={26}
                      color={COLORS.accent}
                    />
                  </View>
                  <Text style={styles.selectedDayEmptyTitle}>No workouts planned</Text>
                  <Text style={styles.selectedDayEmptyText}>
                    Tap add to log a session for this date.
                  </Text>
                </View>
              )}
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.workoutCardWrapper}>
            <SelectedDayWorkoutCard workout={item} index={index} />
          </View>
        )}
        ListEmptyComponent={
          null
        }
      />

      {/* ✅ FIXED FAB */}
     <FAB
        onPress={() =>
          navigation.navigate('Add', {
            date: selectedDate,
            existingWorkouts: selectedDateWorkouts, // ✅ FIXED
          })
        }
      />

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
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedDaySection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  selectedDayEyebrow: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedDayTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  selectedDayAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  selectedDayActionText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryPillText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  muscleChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
  },
  muscleChipDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
  },
  muscleChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedDayEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  selectedDayEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  selectedDayEmptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedDayEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
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

  btnText: {
  color: COLORS.accent,
  fontWeight: '600',
  fontSize: 16,
  left: SPACING.lg,
},
  workoutCardWrapper: {
    marginHorizontal: SPACING.lg,
  },

});
