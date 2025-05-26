// Initialize Mermaid with configuration
mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    logLevel: 1, // 1 = Error, 2 = Warn, 3 = Info, 4 = Debug, 5 = Trace
    flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: false,
        padding: 30
    },
    er: {
        layoutDirection: 'TB',
        entityPadding: 15,
        useMaxWidth: false
    }
});

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Force redraw of the mermaid diagrams in the active tab
            const activeTab = document.getElementById(tabId);
            if (activeTab) {
                const mermaidDivs = activeTab.querySelectorAll('.mermaid');
                mermaidDivs.forEach(div => {
                    // Reset the div and re-initialize
                    if (div.hasAttribute('data-processed')) {
                        div.removeAttribute('data-processed');
                    }
                    setTimeout(() => {
                        mermaid.init(undefined, div);
                    }, 50);
                });
            }
        });
    });
    
    // Render all diagrams manually after the DOM is fully loaded
    setTimeout(() => {
        renderERDiagram();
        renderChenERDiagramTab();
        renderDataFlowDiagram();
        renderContextFlowDiagram();
        
        // Initialize use case diagrams
        renderUseCaseDiagram('auth');
        
        // Force a global initialization for all diagrams with a delay
        setTimeout(() => {
            mermaid.init(undefined, '.mermaid');
        }, 300);
    }, 200);
    
    // Add event listener to the use case selector
    const useCaseSelector = document.getElementById('use-case-selector');
    if (useCaseSelector) {
        useCaseSelector.addEventListener('change', function() {
            renderUseCaseDiagram(this.value);
            // Force initialization after rendering
            setTimeout(() => {
                const useCaseContainer = document.getElementById('use-case-container');
                if (useCaseContainer) {
                    mermaid.init(undefined, useCaseContainer.querySelector('.mermaid'));
                }
            }, 100);
        });
    }
});

// Render Chen ER Diagram in the tab
function renderChenERDiagramTab() {
    if (typeof window.renderChenERDiagram === 'function') {
        const chenDiagram = window.renderChenERDiagram();
        const chenContainer = document.getElementById('chen-er-container');
        if (chenContainer) {
            chenContainer.innerHTML = `<div class="mermaid">${chenDiagram}</div>`;
        }
    }
}

// Entity Relationship Diagram
function renderERDiagram() {
    const erDiagram = `
    erDiagram
        User ||--o{ Profile : has
        User ||--o{ SocialLogin : uses
        User ||--o{ Semester : creates
        User ||--o{ Routine : manages
        User ||--o{ MoodEntry : records
        User ||--o{ ClassSchedule : schedules
        User ||--o{ Appointment : books
        User ||--o{ CommunityPost : publishes
        User ||--o{ PostReply : writes
        
        Profile {
            string id PK
            string username
            string full_name
            string avatar_url
            string gender
            array interests
            string primary_goal
            string bio
            string occupation
            string university
            int profile_completion_percentage
        }
        
        Semester {
            string id PK
            string user_id FK
            string name
            string type
            date start_date
            date end_date
            string status
        }
        
        ClassSchedule {
            string id PK
            string user_id FK
            string semester_id FK
            string course_name
            string course_code
            string room
            string instructor
            string type
            string start_time
            string end_time
            array days_of_week
            json notification_preference
            string frequency
        }
        
        MoodEntry {
            string id PK
            string user_id FK
            string mood_type
            int intensity
            string notes
            timestamp created_at
            int day_of_week
        }
        
        MoodSummary {
            string id PK
            string user_id FK
            date week_start_date
            date week_end_date
            string dominant_mood
            number mood_fluctuation
            array insights
            array recommendations
        }
        
        Routine {
            string id PK
            string user_id FK
            string title
            string frequency
            array custom_days
            string color
            string icon
            boolean is_active
            string notification_time
            boolean notification_enabled
        }
        
        RoutineCompletion {
            string id PK
            string routine_id FK
            string user_id FK
            date completion_date
            timestamp completed_at
            string status
            string notes
        }
        
        Streak {
            string id PK
            string user_id FK
            string title
            string type
            string status
            date start_date
            time start_time
            int current_streak
            int longest_streak
            int target_count
            string color
            string icon
        }
        
        CheckIn {
            string id PK
            string streak_id FK
            date check_date
            string notes
            timestamp created_at
        }
        
        TherapistProfile {
            string id PK
            string bio
            array specializations
            number hourly_rate
            array education
            array certifications
            string experience_years
            json weekly_availability
        }
        
        Appointment {
            string id PK
            string user_id FK
            string therapist_id FK
            timestamp start_time
            timestamp end_time
            string status
            string notes
            string meeting_link
        }
        
        CommunityPost {
            string id PK
            string user_id FK
            string title
            string content
            array media_url
            boolean is_anonymous
            timestamp created_at
            timestamp edited_at
        }
        
        PostReply {
            string id PK
            string post_id FK
            string user_id FK
            string content
            string parent_id
            string thread_path
            timestamp created_at
        }
    `;
    
    // Render the ER diagram
    const erContainer = document.getElementById('er-diagram-container');
    if (erContainer) {
        erContainer.innerHTML = `<div class="mermaid">${erDiagram}</div>`;
    }
}

// Data Flow Diagram
function renderDataFlowDiagram() {
    const dataFlowDiagram = `
    flowchart TB
        %% Add padding elements to ensure diagram renders with enough space
        spacerTop[ ] --- spacerBottom[ ]
        style spacerTop fill:none,stroke:none
        style spacerBottom fill:none,stroke:none
        
        %% External entities represented as squares
        User["User"] 
        style User fill:#e8f4f8,stroke:#4a6fa5,stroke-width:2px
        
        TherapistUser["Therapist"]
        style TherapistUser fill:#e8f4f8,stroke:#4a6fa5,stroke-width:2px
        
        %% Processes represented as rounded rectangles
        subgraph Client["Client Application (React Native)"]
            AuthProcesses["Authentication Processes"]
            DataManagement["Data Management"]
            ContextProviders["Context Providers"]
            Screens["UI Screens"]
        end
        
        %% Data stores represented as open rectangles
        subgraph Storage["Data Storage"]
            RemoteDB["Remote Database (Supabase)"]
            LocalStorage["Local Storage"]
        end
        
        %% Data flow connections
        User --> AuthProcesses
        User --> DataManagement
        
        AuthProcesses --> ContextProviders
        DataManagement --> ContextProviders
        
        ContextProviders --> RemoteDB
        ContextProviders --> LocalStorage
        
        TherapistUser --> DataManagement
        
        RemoteDB --> User
        
        Screens --> User
        Screens --> ContextProviders
        
        %% Style definitions
        classDef process fill:#f5f5f5,stroke:#333,stroke-width:1px;
        classDef dataStore fill:white,stroke:#333,stroke-width:1px;
        classDef externalEntity fill:#e8f4f8,stroke:#4a6fa5,stroke-width:2px;
        
        class AuthProcesses,DataManagement process;
        class ContextProviders process;
        class RemoteDB,LocalStorage dataStore;
    `;
    
    // Render the data flow diagram
    const dataFlowContainer = document.getElementById('data-flow-container');
    if (dataFlowContainer) {
        dataFlowContainer.innerHTML = `<div class="mermaid" style="min-height: 650px;">${dataFlowDiagram}</div>`;
        
        // Force re-render with a slight delay to ensure DOM is ready
        setTimeout(() => {
            const mermaidDiv = dataFlowContainer.querySelector('.mermaid');
            if (mermaidDiv) {
                if (mermaidDiv.hasAttribute('data-processed')) {
                    mermaidDiv.removeAttribute('data-processed');
                }
                mermaid.init(undefined, mermaidDiv);
            }
        }, 100);
    }
}

// Context Flow Diagram
function renderContextFlowDiagram() {
    const contextFlowDiagram = `
    flowchart TB
        App["App Root"] --> Auth
        Auth["AuthContext"] --> Onboarding["OnboardingContext"]
        Auth --> Routine["RoutineContext"]
        Auth --> Mood["MoodContext"]
        Auth --> Semester["SemesterContext"]
        Auth --> Community["CommunityContext"]
        Auth --> Therapist["TherapistContext"]
        
        Community --> PostNav["PostNavigationContext"]
        
        Routine --> User
        Mood --> User
        Semester --> User
        Community --> User
        Therapist --> User
        PostNav --> User
        
        User["User"]
        
        classDef context fill:#f5f5f5,stroke:#333,stroke-width:1px;
        class Auth,Onboarding,Routine,Mood,Semester,Community,PostNav,Therapist context;
    `;
    
    // Render the context flow diagram
    const contextFlowContainer = document.getElementById('context-flow-container');
    if (contextFlowContainer) {
        contextFlowContainer.innerHTML = `<div class="mermaid">${contextFlowDiagram}</div>`;
        
        // Force re-render with a slight delay to ensure DOM is ready
        setTimeout(() => {
            const mermaidDiv = contextFlowContainer.querySelector('.mermaid');
            if (mermaidDiv) {
                if (mermaidDiv.hasAttribute('data-processed')) {
                    mermaidDiv.removeAttribute('data-processed');
                }
                mermaid.init(undefined, mermaidDiv);
            }
        }, 100);
    }
}

// Use Case Diagrams
function renderUseCaseDiagram(type) {
    let useCaseDiagram = '';
    
    switch(type) {
        case 'auth':
            useCaseDiagram = renderAuthUseCases();
            break;
        case 'wellness':
            useCaseDiagram = renderWellnessUseCases();
            break;
        case 'academic':
            useCaseDiagram = renderAcademicUseCases();
            break;
        case 'community':
            useCaseDiagram = renderCommunityUseCases();
            break;
        case 'therapy':
            useCaseDiagram = renderTherapyUseCases();
            break;
        default:
            useCaseDiagram = renderAuthUseCases();
    }
    
    // Render the use case diagram
    const useCaseContainer = document.getElementById('use-case-container');
    if (useCaseContainer) {
        useCaseContainer.innerHTML = `<div class="mermaid">${useCaseDiagram}</div>`;
    }
}

function renderAuthUseCases() {
    return `
    flowchart TB
        User["Student"] --> Login["Login to App"]
        User --> SignUp["Create New Account"]
        User --> SocialAuth["Login with Social Media"]
        User --> ResetPassword["Reset Password"]
        User --> ViewProfile["View Profile"]
        User --> EditProfile["Edit Profile"]
        User --> Logout["Logout"]
        User --> SwitchUser["Switch Between Users"]
        User --> CompleteOnboarding["Complete Onboarding"]
        
        Login --> AuthSystem["Authentication System"]
        SignUp --> AuthSystem
        SocialAuth --> AuthSystem
        ResetPassword --> AuthSystem
        
        classDef useCase fill:#f9f9f9,stroke:#333,stroke-width:1px;
        class Login,SignUp,SocialAuth,ResetPassword,ViewProfile,EditProfile,Logout,SwitchUser,CompleteOnboarding useCase;
    `;
}

function renderWellnessUseCases() {
    return `
    flowchart TB
        User["Student"] --> CreateRoutine["Create Daily Routine"]
        User --> TrackRoutine["Track Routine Completion"]
        User --> ViewStreak["View Streak Progress"]
        User --> CreateStreak["Create New Streak"]
        User --> ResetStreak["Reset Streak"]
        User --> RecordMood["Record Daily Mood"]
        User --> ViewMoodHistory["View Mood History"]
        User --> GetMoodInsights["Get Mood Insights"]
        
        TrackRoutine --> RoutineDB["Routine Database"]
        CreateRoutine --> RoutineDB
        ViewStreak --> StreakDB["Streak Database"]
        CreateStreak --> StreakDB
        ResetStreak --> StreakDB
        RecordMood --> MoodDB["Mood Database"]
        ViewMoodHistory --> MoodDB
        GetMoodInsights --> MoodDB
        
        classDef useCase fill:#f9f9f9,stroke:#333,stroke-width:1px;
        class CreateRoutine,TrackRoutine,ViewStreak,CreateStreak,ResetStreak,RecordMood,ViewMoodHistory,GetMoodInsights useCase;
    `;
}

function renderAcademicUseCases() {
    return `
    flowchart TB
        User["Student"] --> CreateSemester["Create New Semester"]
        User --> AddClassSchedule["Add Class to Schedule"]
        User --> ViewClassSchedule["View Class Schedule"]
        User --> TrackAttendance["Track Class Attendance"]
        User --> ViewAttendance["View Attendance Statistics"]
        User --> ReceiveReminders["Receive Class Reminders"]
        User --> UpdateSchedule["Update Class Schedule"]
        User --> DeleteClass["Delete Class from Schedule"]
        
        CreateSemester --> SemesterDB["Academic Database"]
        AddClassSchedule --> SemesterDB
        ViewClassSchedule --> SemesterDB
        TrackAttendance --> SemesterDB
        ViewAttendance --> SemesterDB
        UpdateSchedule --> SemesterDB
        DeleteClass --> SemesterDB
        ReceiveReminders --> NotificationSystem["Notification System"]
        
        classDef useCase fill:#f9f9f9,stroke:#333,stroke-width:1px;
        class CreateSemester,AddClassSchedule,ViewClassSchedule,TrackAttendance,ViewAttendance,ReceiveReminders,UpdateSchedule,DeleteClass useCase;
    `;
}

function renderCommunityUseCases() {
    return `
    flowchart TB
        User["Student"] --> CreatePost["Create Community Post"]
        User --> ViewPosts["View Community Posts"]
        User --> ReplyToPost["Reply to Post"]
        User --> UpvotePost["Upvote Post"]
        User --> SharePost["Share Post"]
        User --> PostAnonymously["Post Anonymously"]
        User --> UploadMedia["Upload Media to Post"]
        User --> FilterPosts["Filter Posts by Tags"]
        
        CreatePost --> CommunityDB["Community Database"]
        ViewPosts --> CommunityDB
        ReplyToPost --> CommunityDB
        UpvotePost --> CommunityDB
        PostAnonymously --> CommunityDB
        FilterPosts --> CommunityDB
        UploadMedia --> StorageSystem["Media Storage"]
        
        classDef useCase fill:#f9f9f9,stroke:#333,stroke-width:1px;
        class CreatePost,ViewPosts,ReplyToPost,UpvotePost,SharePost,PostAnonymously,UploadMedia,FilterPosts useCase;
    `;
}

function renderTherapyUseCases() {
    return `
    flowchart TB
        User["Student"] --> BrowseTherapists["Browse Available Therapists"]
        User --> ViewTherapistProfile["View Therapist Profile"]
        User --> BookAppointment["Book Therapy Appointment"]
        User --> RescheduleAppointment["Reschedule Appointment"]
        User --> CancelAppointment["Cancel Appointment"]
        User --> AttendSession["Attend Therapy Session"]
        User --> RateTherapist["Rate and Review Therapist"]
        User --> ViewPastSessions["View Past Sessions"]
        
        Therapist["Therapist"] --> ViewAppointments["View Upcoming Appointments"]
        Therapist --> UpdateAvailability["Update Availability"]
        Therapist --> ConductSession["Conduct Therapy Session"]
        
        BrowseTherapists --> TherapistDB["Therapist Database"]
        ViewTherapistProfile --> TherapistDB
        BookAppointment --> AppointmentDB["Appointment Database"]
        ViewAppointments --> AppointmentDB
        UpdateAvailability --> TherapistDB
        
        classDef useCase fill:#f9f9f9,stroke:#333,stroke-width:1px;
        class BrowseTherapists,ViewTherapistProfile,BookAppointment,RescheduleAppointment,CancelAppointment,AttendSession,RateTherapist,ViewPastSessions useCase;
        class ViewAppointments,UpdateAvailability,ConductSession useCase;
    `;
} 