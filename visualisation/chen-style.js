// Chen-style ER Diagram using Mermaid.js flowchart syntax
function renderChenERDiagram() {
    const chenERDiagram = `
    flowchart TB
        %% Entity Definitions (Rectangles)
        User["User"]
        Profile["Profile"]
        Semester["Semester"]
        ClassSchedule["ClassSchedule"]
        MoodEntry["MoodEntry"]
        Routine["Routine"]
        RoutineCompletion["RoutineCompletion"]
        Streak["Streak"]
        CheckIn["CheckIn"]
        TherapistProfile["TherapistProfile"]
        Appointment["Appointment"]
        CommunityPost["CommunityPost"]
        PostReply["PostReply"]
        
        %% Relationship Definitions (Diamonds)
        has{{"has"}}
        creates{{"creates"}}
        schedules{{"schedules"}}
        records{{"records"}}
        manages{{"manages"}}
        completes{{"completes"}}
        tracks{{"tracks"}}
        checks{{"checks in"}}
        books{{"books"}}
        publishes{{"publishes"}}
        replies{{"replies to"}}
        
        %% Entity-Relationship Connections
        User --- has --- Profile
        User --- creates --- Semester
        User --- schedules --- ClassSchedule
        User --- records --- MoodEntry
        User --- manages --- Routine
        User --- tracks --- Streak
        User --- books --- Appointment
        User --- publishes --- CommunityPost
        User --- replies --- PostReply
        
        Routine --- completes --- RoutineCompletion
        Streak --- checks --- CheckIn
        
        %% Cardinality (adding text on lines)
        User --"1"--- has
        has --"1"--- Profile
        
        User --"1"--- creates
        creates --"N"--- Semester
        
        User --"1"--- schedules
        schedules --"N"--- ClassSchedule
        
        User --"1"--- records
        records --"N"--- MoodEntry
        
        User --"1"--- manages
        manages --"N"--- Routine
        
        User --"1"--- tracks
        tracks --"N"--- Streak
        
        User --"1"--- books
        books --"N"--- Appointment
        
        User --"1"--- publishes
        publishes --"N"--- CommunityPost
        
        User --"1"--- replies
        replies --"N"--- PostReply
        
        Routine --"1"--- completes
        completes --"N"--- RoutineCompletion
        
        Streak --"1"--- checks
        checks --"N"--- CheckIn
        
        %% Key Attributes (circles)
        User_id(("id"))
        Profile_id(("id"))
        Semester_id(("id"))
        ClassSchedule_id(("id"))
        MoodEntry_id(("id"))
        Routine_id(("id"))
        RoutineCompletion_id(("id"))
        Streak_id(("id"))
        CheckIn_id(("id"))
        Appointment_id(("id"))
        CommunityPost_id(("id"))
        PostReply_id(("id"))
        
        %% Connect Attributes to Entities
        User --- User_id
        Profile --- Profile_id
        Semester --- Semester_id
        ClassSchedule --- ClassSchedule_id
        MoodEntry --- MoodEntry_id
        Routine --- Routine_id
        RoutineCompletion --- RoutineCompletion_id
        Streak --- Streak_id
        CheckIn --- CheckIn_id
        Appointment --- Appointment_id
        CommunityPost --- CommunityPost_id
        PostReply --- PostReply_id
        
        %% Styling
        classDef entity fill:#f9f9f9,stroke:#333,stroke-width:2px;
        classDef relationship fill:#FFD700,stroke:#333,stroke-width:1px;
        classDef attribute fill:#FFFFFF,stroke:#333,stroke-width:1px;
        
        class User,Profile,Semester,ClassSchedule,MoodEntry,Routine,RoutineCompletion,Streak,CheckIn,TherapistProfile,Appointment,CommunityPost,PostReply entity;
        class has,creates,schedules,records,manages,completes,tracks,checks,books,publishes,replies relationship;
        class User_id,Profile_id,Semester_id,ClassSchedule_id,MoodEntry_id,Routine_id,RoutineCompletion_id,Streak_id,CheckIn_id,Appointment_id,CommunityPost_id,PostReply_id attribute;
    `;
    
    return chenERDiagram;
}

// Export the function
window.renderChenERDiagram = renderChenERDiagram; 