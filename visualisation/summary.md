# UniWell Visualization Tool - Summary

## Overview

The UniWell Visualization Tool provides comprehensive diagrams that represent different aspects of the application architecture:

1. **Entity Relationship Diagram (ERD)**
   - Shows the database schema and relationships between entities
   - Highlights the core data models: User, Profile, Semester, ClassSchedule, MoodEntry, Routine, Streak, etc.
   - Illustrates relationships between these entities (one-to-many, many-to-many, etc.)

2. **Chen-style ER Diagram**
   - Traditional entity-relationship notation as seen in academic textbooks
   - Uses rectangles for entities, diamonds for relationships, and ovals for attributes
   - Clearly shows cardinality between entities with 1:N notation
   - Matches the style of classic ER diagrams used in database design documentation

3. **Data Flow Diagram**
   - Visualizes how data flows through the application
   - Shows the client-server architecture with React Native frontend and Supabase backend
   - Illustrates the communication between different layers
   - Highlights the role of context providers, hooks, and the Supabase client

4. **Context Flow Diagram**
   - Depicts the relationships between different React contexts
   - Shows how contexts depend on each other
   - Highlights the key features provided by each context
   - Illustrates the user interaction points

5. **UML Use Case Diagrams**
   - Provides visual representation of user interactions with the system
   - Organized by domain (Authentication, Wellness, Academic, Community, Therapy)
   - Shows actors (Students, Therapists) and their relationship to use cases
   - Illustrates system boundaries and dependencies

## Technical Implementation

- **Framework**: Pure HTML, CSS, and JavaScript
- **Visualization Library**: Mermaid.js
- **Chen Notation**: Implemented using Mermaid flowchart with custom styling
- **Responsive Design**: Works on both desktop and mobile browsers
- **No Dependencies**: Runs entirely in the browser with no server requirements
- **Interactive**: Includes tab navigation and domain selector for use cases

## Key Domains Represented in Use Cases

1. **Authentication & User Management**
   - Login, signup, password reset, profile management
   - Social authentication
   - Multi-user support and user switching
   - Onboarding process

2. **Academic Management**
   - Semester creation and management
   - Class schedule management
   - Attendance tracking
   - Class reminders and notifications

3. **Wellness Tracking**
   - Routine creation and tracking
   - Streak management
   - Mood recording and analysis
   - Insights and recommendations

4. **Community & Support**
   - Post creation and interaction
   - Anonymous posting
   - Media sharing
   - Content moderation

5. **Therapy Management**
   - Therapist browsing and selection
   - Appointment booking and management
   - Session attendance
   - Reviews and ratings

## Intended Use

These diagrams are designed to be used in project documentation to help:

1. **New Developers**: Quickly understand the system architecture and user interactions
2. **Stakeholders**: Visualize the system components, their relationships, and functionality
3. **Documentation**: Provide visual aids that complement written explanations
4. **Requirements Analysis**: Clarify and communicate system requirements and user stories

The visualizations are intentionally kept simple and focused to fit on a single documentation page while still conveying the essential structure and functionality of the application. 