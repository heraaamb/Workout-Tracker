import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { WorkoutCard } from '../components/WorkoutCard';
import { FAB } from '../components/FAB';
import { loadWorkouts } from '../utils/storage';
import { COLORS, globalStyles, SPACING, RADIUS } from '../styles/theme';
import type { Workout, MuscleGroup } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const navigation = useNavigation<NavigationProp>();

  const fetchWorkouts = async () => {
    const data = await loadWorkouts();
    setWorkouts(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  // Build marked dates for calendar with colors
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    const muscleColorsMap: Record<MuscleGroup, string> = {
      Chest: '#3B82F6',
      Back: '#22C55E',
      Legs: '#EF4444',
      Shoulders: '#EAB308',
      Biceps: '#A855F7',
      Triceps: '#A855F7',
      Core: '#F97316',
    };

    workouts.forEach(w => {
      const dateStr = w.date.split('T')[0];
      if (!marked[dateStr]) {
        marked[dateStr] = { dots: [] };
      }
      const color = muscleColorsMap[w.muscleGroup] || COLORS.accent;
      marked[dateStr].dots!.push({
        color,
        key: w.muscleGroup,
        selectedDotIndex: 0,
      });
    });

    // Add selection styling
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = COLORS.accent;
    } else {
      marked[selectedDate] = { selected: true, selectedColor: COLORS.accent };
    }

    return marked;
  }, [workouts, selectedDate]);

  // Get workouts for selected date
  const selectedDateWorkouts = workouts.filter(w => 
    w.date.split('T')[0] === selectedDate
  );

  const filteredWorkouts = selectedMuscle === 'All'
    ? selectedDateWorkouts
    : selectedDateWorkouts.filter(w => w.muscleGroup === selectedMuscle);

  const selectedDateObj = new Date(selectedDate);
  const formattedDate = selectedDateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const FilterPills = () => (
    <View style={styles.filtersWrapper}>
      <Text style={styles.sectionTitle}>Muscle Group</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['All', ...MUSCLE_GROUPS] as ('All' | MuscleGroup)[]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isSelected = item === selectedMuscle;
          const color = item === 'All' ? COLORS.accent : (COLORS.muscleGroups[item] || COLORS.textSecondary);
          return (
            <TouchableOpacity
              style={[
                styles.pill,
                isSelected ? { backgroundColor: `${color}20`, borderColor: color } : {}
              ]}
              onPress={() => setSelectedMuscle(item)}
            >
              <Text style={[styles.pillText, isSelected ? { color } : {}]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.filtersContent}
      />
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
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
          onPress={() => navigation.navigate('MuscleProgress' as any)}
        >
          <MaterialCommunityIcons name="chart-bar" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(w, index) => `${w.id}-${index}`}
        ListHeaderComponent={
          <>
            <View style={styles.calendarWrapper}>
              <Calendar
                current={selectedDate}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setSelectedMuscle('All');
                }}
                markedDates={markedDates}
                markingType="multi-dot"
                theme={{
                  backgroundColor: COLORS.background,
                  calendarBackground: COLORS.surface,
                  textSectionTitleColor: COLORS.text,
                  selectedDayBackgroundColor: COLORS.accent,
                  selectedDayTextColor: COLORS.background,
                  todayTextColor: COLORS.accent,
                  dayTextColor: COLORS.text,
                  textDisabledColor: COLORS.textSecondary,
                  dotColor: COLORS.accent,
                  selectedDotColor: COLORS.background,
                  arrowColor: COLORS.accent,
                  monthTextColor: COLORS.text,
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                }}
              />
            </View>
            <View style={styles.dateInfoWrapper}>
              <Text style={styles.selectedDateText}>{formattedDate}</Text>
            </View>
            {selectedDateWorkouts.length > 0 && FilterPills()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyText}>No workouts recorded</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <WorkoutCard workout={item} showDate={false} />
        )}
        contentContainerStyle={styles.listContent}
      />

      <FAB onPress={() => navigation.navigate('AddWorkout')} />
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
});
