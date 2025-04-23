export enum DayOfTheWeek {
    MONDAY = 'monday',
    TUESDAY = 'tuesday', 
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
    SUNDAY = 'sunday'
}

export enum ClassFrequency {
    WEEKLY = 'weekly',
    BI_WEEKLY = 'bi-weekly',
    MULTIPLE_TIMES_PER_WEEK = 'multiple-times-per-week'
}



export enum ClassType {
    LECTURE = 'lecture',
    LAB = 'lab',
    SEMINAR = 'seminar',
    WORKSHOP = 'workshop',
    FIELD_TRIP = 'field-trip',
    EXAM = 'exam',
    PROJECT = 'project',
    QUIZ = 'quiz',
    ONLINE = 'online'
}

export enum SemesterType {
    FALL = 'fall',
    SPRING = 'spring',
    SUMMER = 'summer',
    WINTER = 'winter',
    CUSTOM = 'custom'
}
export interface ClassSchedule {
    id: string;
    userId: string;
    semesterId: string;
    courseName: string;
    room: string;
    courseCode: string;
    instructor: string;
    frequency: ClassFrequency;
    type: ClassType;
    startTime: Date;
    endTime: Date;
    classType: string;
    daysOfWeek: DayOfTheWeek[];
    notificationPreference: {
        beforeClass: number;
        afterClass: number | null;
       onMorning: number;
    }   
}

export interface AttendanceRecord {
    id: string;
    classId: string;
    attended: boolean;
    date: Date;
    notes?: string;
    
}

export interface Assignment {
    id: string;
    classId: string;
    title: string;
    description: string;
    dueDate: Date;
    completed: boolean;
    submissionDate: Date;
    
}

export interface TimetableNotification {
    id: string;
    type: 'class_reminder' | 'class_completed' | 'attendance_check' | 'assignment_reminder';
    message: string;
    timestamp: Date;
    read: boolean;
    relatedEntity?: string;

}

export interface EditableClass extends Omit<ClassSchedule, 'startTime' | 'endTime'> {
  startTime: string;
  endTime: string;
}

export interface Semester {
    id: string;
    name: string;
    type: SemesterType;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'inactive';
    userId: string;
    createdAt: Date;
}
export interface NewSemester {
    name: string;
    type: SemesterType;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'inactive';
    userId: string;
}