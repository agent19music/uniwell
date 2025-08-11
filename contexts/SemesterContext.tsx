import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
    Semester, 
    SemesterType, 
    ClassSchedule, 
    Assignment, 
    AttendanceRecord, 
    NewSemester ,
    TimetableNotification
} from '../types/TimetableTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

interface SemesterContextType {
    semesters: Semester[];
    activeSemester: Semester | null;
    classSchedules: ClassSchedule[];
    attendanceRecords: AttendanceRecord[];
    assignments: Assignment[];
    isLoading: boolean;
    error: string | null;
    loadSemesters: () => Promise<void>;
    createSemester: (semesterData: Omit<NewSemester, 'userId'>) => Promise<Semester | null>;
    updateSemester: (id: string, semesterData: Partial<Semester>) => Promise<boolean>;
    deleteSemester: (id: string) => Promise<boolean>;
    setActiveSemesterById: (id: string) => Promise<boolean>;
    loadClassSchedulesForSemester: (semesterId: string) => Promise<ClassSchedule[]>;
    addClassSchedule: (schedule: Omit<ClassSchedule, 'id'>) => Promise<ClassSchedule | null>;
    updateClassSchedule: (id: string, schedule: Partial<ClassSchedule>) => Promise<boolean>;
    deleteClassSchedule: (id: string) => Promise<boolean>;
    recordAttendance: (classId: string, attended: boolean) => Promise<void>;
    calculateAttendance: (classId: string) => number;
}

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

export const useSemester = () => {
    const context = useContext(SemesterContext);
    if (!context) {
        throw new Error('useSemester must be used within a SemesterProvider');
    }
    return context;
};

export const SemesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
    const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { currentUser  } = useAuth();
    const user = currentUser

    useEffect(() => {
        loadStoredData();
       }, [user]);

    // Move all the functions from useTimetableManagement here
    const loadSemesters = async () => {
        try {
            setIsLoading(true);
            
            if (!currentUser) {
                setError('User not authenticated');
                setIsLoading(false);
                return;
            }
            
            const { data, error } = await supabase
                .from('semesters')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            const formattedSemesters = data.map((semester: { id: string; name: string; type: SemesterType; start_date: string; end_date: string; created_at: string; status: string; user_id: string }) => ({
                id: semester.id,
                name: semester.name,
                type: semester.type as SemesterType,
                startDate: new Date(semester.start_date),
                endDate: new Date(semester.end_date),
                createdAt: new Date(semester.created_at),
                status: semester.status as 'active' | 'inactive',
                userId: semester.user_id
            }));
            
            setSemesters(formattedSemesters);
            
            if (formattedSemesters.length > 0 && !activeSemester) {
                const activeSem = formattedSemesters.find((s: { status: string }) => s.status === 'active');
                const semesterToUse = activeSem || formattedSemesters[0];
                setActiveSemester(semesterToUse);
                await loadClassSchedulesForSemester(semesterToUse.id);
            }
            
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading semesters:', error);
            setError('Failed to load semesters');
            setIsLoading(false);
        }
    };

    const loadStoredData = async () => {
        try {
            setIsLoading(true);
            
            if (!user) {
                setError('User not authenticated');
                setIsLoading(false);
                return;
            }
            
            // First load semesters
            await loadSemesters();
            
            // Then load class schedules for the active semester (if any)
            if (activeSemester) {
                const { data: scheduleData, error: scheduleError } = await supabase
                    .from('class_schedules')
                    .select('*')
                    .eq('semester_id', activeSemester.id);
                    
                if (scheduleError) {
                    throw scheduleError;
                }
                
                const formattedSchedules: ClassSchedule[] = scheduleData.map((schedule: { id: string; user_id: string; semester_id: string; course_name: string; course_code: string; room: string; instructor: string; type: string; start_time: string; end_time: string; days_of_week: string; notification_preference: string; frequency: string }) => ({
                    id: schedule.id,
                    userId: schedule.user_id,
                    semesterId: schedule.semester_id,
                    courseName: schedule.course_name,
                    courseCode: schedule.course_code,
                    room: schedule.room,
                    instructor: schedule.instructor,
                    type: schedule.type,
                    startTime: schedule.start_time,
                    endTime: schedule.end_time,
                    daysOfWeek: JSON.parse(schedule.days_of_week || '[]'),
                    notificationPreference: JSON.parse(schedule.notification_preference || '{"beforeClass":15,"afterClass":null,"onMorning":60}'),
                    frequency: schedule.frequency
                }));
                
                setClassSchedules(formattedSchedules);
            }
            
            // For backward compatibility, we still try to load from AsyncStorage
            // This can be removed once all data is migrated to Supabase
            const storedAttendance = await AsyncStorage.getItem('attendanceRecords');
            const storedAssignments = await AsyncStorage.getItem('assignments');
            const storedNotifications = await AsyncStorage.getItem('notifications');

            if (storedAttendance) setAttendanceRecords(JSON.parse(storedAttendance));
            if (storedAssignments) setAssignments(JSON.parse(storedAssignments));
            if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
            
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading stored data:', error);
            setError('Failed to load data');
            setIsLoading(false);
        }
    };

    /**
     * Creates a new semester and stores it in Supabase
     * Transforms camelCase frontend data to snake_case for database storage
     */
    const createSemester = async (semesterData: Omit<NewSemester, 'userId'>) => {
        try {
            console.log('Starting createSemester with data:', semesterData);
            
            if (!user) {
                console.error('User not authenticated');
                setError('User not authenticated');
                return null;
            }
            
            // Validate required fields
            if (!semesterData.name || !semesterData.startDate || !semesterData.endDate || !semesterData.type) {
                console.error('Missing required fields:', { 
                    name: !!semesterData.name,
                    startDate: !!semesterData.startDate,
                    endDate: !!semesterData.endDate,
                    type: !!semesterData.type
                });
                setError('Missing required semester data');
                return null;
            }
            
            // Convert dates to ISO strings for Supabase
            const startDateISO = semesterData.startDate instanceof Date 
                ? semesterData.startDate.toISOString().split('T')[0]
                : new Date(semesterData.startDate).toISOString().split('T')[0];
                
            const endDateISO = semesterData.endDate instanceof Date
                ? semesterData.endDate.toISOString().split('T')[0]
                : new Date(semesterData.endDate).toISOString().split('T')[0];
            
            // Transform camelCase to snake_case for Supabase
            const newSemesterForSupabase = {
                name: semesterData.name,
                type: semesterData.type,
                start_date: startDateISO,
                end_date: endDateISO,
                status: semesterData.status || 'inactive',
                user_id: user.id,
            };
            
            console.log('Sending to Supabase:', newSemesterForSupabase);
            
            // Insert into Supabase
            const { data, error } = await supabase
                .from('semesters')
                .insert(newSemesterForSupabase)
                .select()
                .single();
                
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            if (!data) {
                console.error('No data returned from creation');
                throw new Error('No data returned from semester creation');
            }
            
            console.log('Successfully created semester:', data);
            
            // Transform the returned data from snake_case back to camelCase
            const formattedSemester: Semester = {
                id: data.id,
                name: data.name,
                type: data.type as SemesterType,
                startDate: new Date(data.start_date),
                endDate: new Date(data.end_date),
                createdAt: new Date(data.created_at),
                status: data.status as 'active' | 'inactive',
                userId: data.user_id
            };
            
            // Update local state with the new semester
            setSemesters(prev => [...prev, formattedSemester]);
            
            return formattedSemester;
        } catch (error) {
            console.error('Error in createSemester:', error);
            setError('Failed to create semester');
            return null;
        }
    };
    
    /**
     * Updates an existing semester in Supabase
     * Transforms camelCase frontend data to snake_case for database storage
     */
    const updateSemester = async (id: string, semesterData: Partial<Semester>) => {
        try {
            if (!user) {
                setError('User not authenticated');
                return false;
            }
            
            // Prepare data for Supabase (convert camelCase to snake_case)
            const updateData: Record<string, any> = {};
            
            if (semesterData.name !== undefined) {
                updateData.name = semesterData.name;
            }
            
            if (semesterData.type !== undefined) {
                updateData.type = semesterData.type;
            }
            
            // Handle date conversions for Supabase
            if (semesterData.startDate !== undefined) {
                const startDateISO = semesterData.startDate instanceof Date 
                    ? semesterData.startDate.toISOString().split('T')[0]
                    : new Date(semesterData.startDate).toISOString().split('T')[0];
                updateData.start_date = startDateISO;
            }
            
            if (semesterData.endDate !== undefined) {
                const endDateISO = semesterData.endDate instanceof Date
                    ? semesterData.endDate.toISOString().split('T')[0]
                    : new Date(semesterData.endDate).toISOString().split('T')[0];
                updateData.end_date = endDateISO;
            }
            
            // If we're setting this semester to active, deactivate all other semesters
            if (semesterData.status === 'active') {
                // First deactivate all semesters for this user
                const { error: updateError } = await supabase
                    .from('semesters')
                    .update({ status: 'inactive' })
                    .eq('user_id', user.id)
                    .neq('id', id); // Don't update the current semester
                    
                if (updateError) {
                    console.error('Error deactivating other semesters:', updateError);
                }
                
                // Set the status in the update data
                updateData.status = 'active';
            } else if (semesterData.status === 'inactive') {
                // If explicitly setting to inactive
                updateData.status = 'inactive';
            }
            
            // Only update Supabase if we have data to update
            if (Object.keys(updateData).length > 0) {
                const { error } = await supabase
                    .from('semesters')
                    .update(updateData)
                    .eq('id', id);
                    
                if (error) {
                    console.error('Error updating semester in Supabase:', error);
                    throw error;
                }
            }
            
            // Update local state with all changes including status
            setSemesters(prev => 
                prev.map(semester => 
                    semester.id === id 
                        ? { ...semester, ...semesterData } 
                        : semesterData.status === 'active' 
                            ? { ...semester, status: 'inactive' }
                            : semester
                )
            );
            
            // Update active semester if this is now the active one or if this was the active one
            if (semesterData.status === 'active') {
                const updatedSemester = semesters.find((s: Semester) => s.id === id);
                if (updatedSemester) {
                    setActiveSemester({...updatedSemester, ...semesterData});
                }
            } else if (activeSemester?.id === id) {
                // If we're updating the active semester but not changing its active status
                setActiveSemester({...activeSemester, ...semesterData});
            }
            
            return true;
        } catch (error) {
            console.error('Error updating semester:', error);
            setError('Failed to update semester');
            return false;
        }
    };
    
    const deleteSemester = async (id: string) => {
        try {
            if (!user) {
                setError('User not authenticated');
                return false;
            }
            
            // First, delete all class schedules associated with this semester
            const { error: scheduleError } = await supabase
                .from('class_schedules')
                .delete()
                .eq('semester-id', id);
                
            if (scheduleError) {
                throw scheduleError;
            }
            
            // Then delete the semester
            const { error } = await supabase
                .from('semesters')
                .delete()
                .eq('id', id);
                
            if (error) {
                throw error;
            }
            
            // Update local state
            setSemesters(prev => prev.filter(semester => semester.id !== id));
            
            // Update active semester if needed
            if (activeSemester?.id === id) {
                setActiveSemester(null);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting semester:', error);
            setError('Failed to delete semester');
            return false;
        }
    };
    
    const setActiveSemesterById = async (id: string) => {
        try {
            if (!user) {
                setError('User not authenticated');
                return false;
            }
            
            // First deactivate all semesters
            await deactivateAllSemesters();
            
            // Then activate the selected one
            const { error } = await supabase
                .from('semesters')
                .update({ status: 'active' })
                .eq('id', id);
                
            if (error) {
                throw error;
            }
            
            // Update local state
            setSemesters(prev => 
                prev.map(semester => ({
                    ...semester,
                    status: semester.id === id ? 'active' : 'inactive'
                }))
            );
            
            // Set the active semester
            const newActiveSemester = semesters.find(s => s.id === id);
            if (newActiveSemester) {
                setActiveSemester({ ...newActiveSemester, status: 'active' });
                
                // Load class schedules for this semester
                await loadClassSchedulesForSemester(id);
            }
            
            return true;
        } catch (error) {
            console.error('Error setting active semester:', error);
            setError('Failed to set active semester');
            return false;
        }
    };
    
    const deactivateAllSemesters = async () => {
        try {
            if (!user) {
                return false;
            }
            
            // Set all semesters to inactive
            const { error } = await supabase
                .from('semesters')
                .update({ status: 'inactive' })
                .eq('user_id', user.id)
                .eq('status', 'active');
                
            if (error) {
                throw error;
            }
            
            // Update local state to match
            setSemesters(prev => 
                prev.map(semester => ({
                    ...semester,
                    status: 'inactive'
                }))
            );
            
            return true;
        } catch (error) {
            console.error('Error deactivating semesters:', error);
            return false;
        }
    };
    
    const loadClassSchedulesForSemester = async (semesterId: string) => {
        try {
            const { data, error } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('semester_id', semesterId);
                
            if (error) throw error;

            // Transform the data to match ClassSchedule type
            const formattedSchedules: ClassSchedule[] = data.map((schedule: { id: string; user_id: string; semester_id: string; course_name: string; course_code: string; room: string; instructor: string; type: string; start_time: string; end_time: string; days_of_week: string; notification_preference: string; frequency: string }) => ({
                id: schedule.id,
                userId: schedule.user_id,
                semesterId: schedule.semester_id,
                courseName: schedule.course_name,
                courseCode: schedule.course_code,
                room: schedule.room,
                instructor: schedule.instructor,
                type: schedule.type,
                startTime: schedule.start_time,
                endTime: schedule.end_time,
                daysOfWeek: JSON.parse(schedule.days_of_week || '[]'),
                notificationPreference: JSON.parse(schedule.notification_preference || '{"beforeClass":15,"afterClass":null,"onMorning":60}'),
                frequency: schedule.frequency
            }));

            setClassSchedules(formattedSchedules);
            return formattedSchedules;
        } catch (error) {
            console.error('Error loading class schedules:', error);
            setError('Failed to load class schedules');
            return [];
        }
    };
    
    // Updated save data function that uses Supabase
    const saveData = async () => {
        try {
            // For now, keep backward compatibility with AsyncStorage
            await AsyncStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
            await AsyncStorage.setItem('assignments', JSON.stringify(assignments));
            await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };


    const addClassSchedule = async (schedule: Omit<ClassSchedule, 'id'>) => {
        try {
            if (!user) {
                setError('User not authenticated');
                return null;
            }
            
            // Transform the data to match Supabase schema (camelCase to snake_case)
            const newScheduleForSupabase = {
                user_id: user.id,  // Ensure this matches the authenticated user's ID
                semester_id: activeSemester?.id,
                semester_start: activeSemester?.startDate,
                semester_end: activeSemester?.endDate,
                course_name: schedule.courseName,
                room: schedule.room,
                course_code: schedule.courseCode,
                instructor: schedule.instructor,
                frequency: schedule.frequency,
                type: schedule.type,
                start_time: schedule.startTime,
                end_time: schedule.endTime,
                days_of_week: schedule.daysOfWeek,
                notification_preference: JSON.stringify(schedule.notificationPreference)
            };
            console.log('Sending to Supabase:', newScheduleForSupabase);
            
            const { data, error } = await supabase
                .from('class_schedules')
                .insert(newScheduleForSupabase)
                .select()
                .single();
                
            if (error) throw error;
            
            // Transform the returned data back to camelCase for frontend
            const formattedSchedule: ClassSchedule = {
                id: data.id,
                userId: data.user_id,
                semesterId: data.semester_id,
                courseName: data.course_name,
                room: data.room,
                courseCode: data.course_code,
                instructor: data.instructor,
                frequency: data.frequency,
                type: data.type,
                startTime: data.start_time,
                endTime: data.end_time,
                daysOfWeek: data.days_of_week,
                notificationPreference: JSON.parse(data.notification_preference)
            };
            
            setClassSchedules(prev => [...prev, formattedSchedule]);
            return formattedSchedule;
        } catch (error) {
            console.error('Error adding class schedule:', error);
            setError('Failed to add class schedule');
            return null;
        }
    };

    const recordAttendance = async (classId: string, attended: boolean) => {
        const attendanceRecord: AttendanceRecord = {
            id: uuidv4(),
            classId,
            attended,
            date: new Date()
        };
        const updatedAttendance = [...attendanceRecords, attendanceRecord];
        setAttendanceRecords(updatedAttendance);
        await saveData();
    };

    const generateClassNotifications = async (schedule: ClassSchedule) => {
        const beforeClassNotification: TimetableNotification = {
            id: uuidv4(),
            type: 'class_reminder',
            message: `Reminder: ${schedule.courseName} in ${schedule.room} starts in ${schedule.notificationPreference.beforeClass} hours`,
            timestamp: new Date(new Date(schedule.startTime).getTime() - (schedule.notificationPreference.beforeClass * 60 * 60 * 1000)),
            read: false
        };
        const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
            const newAssignment: Assignment = {...assignment, id: uuidv4()};
            const updatedAssignments = [...assignments, newAssignment];
            setAssignments(updatedAssignments);
            await saveData();
            generateAssignmentNotifications(newAssignment);
        };
    
        const afterClassNotification: TimetableNotification = {
            id: uuidv4(),
            type: 'class_completed',
            message: `${schedule.courseName} in ${schedule.room} has ended`,
            timestamp: new Date(schedule.endTime),
            read: false
        };
      
        const morningNotification: TimetableNotification = {
            id: uuidv4(),
            type: 'attendance_check',
            message: `Good morning! You have ${schedule.courseName} in ${schedule.room} today`,
            relatedEntity: schedule.id,
            timestamp: new Date(),
            read: false
        };

        const generateAssignmentNotifications = (assignment: Assignment) => {
            const dueSoonNotification: TimetableNotification = {
                id: uuidv4(),
                type: 'assignment_reminder',
                message: `Reminder: ${assignment.title} is due soon`,
                relatedEntity: assignment.id,
                timestamp: new Date(assignment.dueDate.getTime() -  24 * 60 * 60 * 1000),
                read: false
            };
            const updatedNotifications = [...notifications, dueSoonNotification];
            setNotifications(updatedNotifications as Notification[]);
        };

        const updatedNotifications = [
            ...notifications,
            ...(schedule.notificationPreference.beforeClass > 0 ? [beforeClassNotification] : []),
            ...(schedule.notificationPreference.afterClass && schedule.notificationPreference.afterClass > 0 ? [afterClassNotification] : []),
            ...(schedule.notificationPreference.onMorning > 0 ? [morningNotification] : [])
        ];

        setNotifications(updatedNotifications as Notification[]);
        await saveData();
    };

    const calculateAttendance = (classId: string) => {
        const classRecords = attendanceRecords.filter(record => record.classId === classId);
        const totalClasses = classRecords.length;
        const attendedClasses = classRecords.filter(record => record.attended).length;
        return totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
    };
    

    const updateClassSchedule = async (id: string, updatedSchedule: Partial<ClassSchedule>) => {
        try {
            if (!user) {
                setError('User not authenticated');
                return false;
            }
            
            // Transform the data to match Supabase schema (camelCase to snake_case)
            const updateData: Record<string, any> = {};
            
            if (updatedSchedule.courseName !== undefined) updateData.course_name = updatedSchedule.courseName;
            if (updatedSchedule.room !== undefined) updateData.room = updatedSchedule.room;
            if (updatedSchedule.courseCode !== undefined) updateData.course_code = updatedSchedule.courseCode;
            if (updatedSchedule.instructor !== undefined) updateData.instructor = updatedSchedule.instructor;
            if (updatedSchedule.frequency !== undefined) updateData.frequency = updatedSchedule.frequency;
            if (updatedSchedule.type !== undefined) updateData.type = updatedSchedule.type;
            if (updatedSchedule.startTime !== undefined) updateData.start_time = updatedSchedule.startTime;
            if (updatedSchedule.endTime !== undefined) updateData.end_time = updatedSchedule.endTime;
            if (updatedSchedule.daysOfWeek !== undefined) updateData.days_of_week = updatedSchedule.daysOfWeek;
            if (updatedSchedule.notificationPreference !== undefined) {
                updateData.notification_preference = JSON.stringify(updatedSchedule.notificationPreference);
            }
            
            // Update in Supabase
            const { error } = await supabase
                .from('class_schedules')
                .update(updateData)
                .eq('id', id);
                
            if (error) {
                throw error;
            }
            
            // Update local state
            setClassSchedules(prev => 
                prev.map(schedule => 
                    schedule.id === id 
                        ? { ...schedule, ...updatedSchedule }
                        : schedule
                )
            );
            
            return true;
        } catch (error) {
            console.error('Error updating class schedule:', error);
            setError('Failed to update class schedule');
            return false;
        }
    };

    const deleteClassSchedule = async (id: string) => {
        try {
            if (!user) {
                setError('User not authenticated');
                return false;
            }
            
            // Delete from Supabase
            const { error } = await supabase
                .from('class_schedules')
                .delete()
                .eq('id', id);
                
            if (error) {
                throw error;
            }
            
            // Update local state
            const updatedSchedules = classSchedules.filter(schedule => schedule.id !== id);
            setClassSchedules(updatedSchedules);
            
            return true;
        } catch (error) {
            console.error('Error deleting class schedule:', error);
            setError('Failed to delete class schedule');
            return false;
        }
    };

 
    const recordAssignmentSubmission = async (assignmentId: string, submission: string) => {
        const updatedAssignments = assignments.map(assignment => 
            assignment.id === assignmentId ? {...assignment, submission} : assignment
        );
        setAssignments(updatedAssignments);
        await saveData();
    };  

    useEffect(() => {
        if (currentUser) {
            loadSemesters();
        }
    }, [currentUser]);

    const value = {
        semesters,
        activeSemester,
        classSchedules,
        attendanceRecords,
        assignments,
        isLoading,
        error,
        loadSemesters,
        createSemester,
        updateSemester,
        deleteSemester,
        setActiveSemesterById,
        loadClassSchedulesForSemester,
        addClassSchedule,
        updateClassSchedule,
        deleteClassSchedule,
        recordAttendance,
        calculateAttendance,
    };

    return (
        <SemesterContext.Provider value={value}>
            {children}
        </SemesterContext.Provider>
    );
};




