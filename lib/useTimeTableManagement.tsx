import { useEffect, useState } from 'react';
import { 
  ClassFrequency, 
  ClassType, 
  ClassSchedule,
  Assignment,
  AttendanceRecord,
  TimetableNotification
} from '../types/TimetableTypes';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {v4 as uuidv4} from 'uuid';

export const useTimetableManagement = () => {
    const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
     loadStoredData();
    }, []);

    const loadStoredData = async () => {
        try {
            const storedSchedules = await AsyncStorage.getItem('classSchedules');
            const storedAttendance = await AsyncStorage.getItem('attendanceRecords');
            const storedAssignments = await AsyncStorage.getItem('assignments');
            const storedNotifications = await AsyncStorage.getItem('notifications');

            if (storedSchedules) setClassSchedules(JSON.parse(storedSchedules));
            if (storedAttendance) setAttendanceRecords(JSON.parse(storedAttendance));
            if (storedAssignments) setAssignments(JSON.parse(storedAssignments));
            if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    };

    const saveData = async () => {
        try {
            await AsyncStorage.setItem('classSchedules', JSON.stringify(classSchedules));
            await AsyncStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
            await AsyncStorage.setItem('assignments', JSON.stringify(assignments));
            await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const addClassSchedule = async (schedule: Omit<ClassSchedule, 'id'>) => {
        const newSchedule: ClassSchedule = {...schedule, id: uuidv4()};
        const updatedSchedules = [...classSchedules, newSchedule];
        setClassSchedules(updatedSchedules);
        await saveData();
        generateClassNotifications(newSchedule);
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
        const updatedSchedules = classSchedules.map(schedule => 
            schedule.id === id ? {...schedule, ...updatedSchedule} : schedule
        );
        setClassSchedules(updatedSchedules);
        await saveData();
    };

    const deleteClassSchedule = async (id: string) => {
        const updatedSchedules = classSchedules.filter(schedule => schedule.id !== id);
        setClassSchedules(updatedSchedules);
        await saveData();
    };

 
    const recordAssignmentSubmission = async (assignmentId: string, submission: string) => {
        const updatedAssignments = assignments.map(assignment => 
            assignment.id === assignmentId ? {...assignment, submission} : assignment
        );
        setAssignments(updatedAssignments);
        await saveData();
    };  
    
    return {
        classSchedules,
        attendanceRecords,
        assignments,
        notifications,
        addClassSchedule,
    }
}
