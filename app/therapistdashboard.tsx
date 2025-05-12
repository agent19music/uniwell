import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

// Mock data for appointments
const APPOINTMENTS = [
  {
    id: 1,
    patient: {
      name: 'Alex Thompson',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    },
    date: '2025-05-12',
    time: '10:00 AM - 11:00 AM',
    status: 'confirmed',
    notes: 'Follow-up session on anxiety management techniques',
    type: 'Video Call'
  },
  {
    id: 2,
    patient: {
      name: 'Jordan Wilson',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
    date: '2025-05-12',
    time: '2:30 PM - 3:30 PM',
    status: 'confirmed',
    notes: 'Initial consultation',
    type: 'In-person'
  },
  {
    id: 3,
    patient: {
      name: 'Taylor Rivera',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    },
    date: '2025-05-13',
    time: '9:00 AM - 10:00 AM',
    status: 'pending',
    notes: 'Depression screening and treatment planning',
    type: 'Video Call'
  },
  {
    id: 4,
    patient: {
      name: 'Sam Johnson',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    },
    date: '2025-05-14',
    time: '4:00 PM - 5:00 PM',
    status: 'confirmed',
    notes: 'Stress management follow-up',
    type: 'Video Call'
  },
];

// Mock available time slots
const AVAILABILITY = [
  { day: 'Monday', slots: ['9:00 AM - 12:00 PM', '2:00 PM - 6:00 PM'] },
  { day: 'Tuesday', slots: ['10:00 AM - 12:00 PM', '1:00 PM - 5:00 PM'] },
  { day: 'Wednesday', slots: ['9:00 AM - 1:00 PM', '2:00 PM - 4:00 PM'] },
  { day: 'Thursday', slots: ['11:00 AM - 3:00 PM'] },
  { day: 'Friday', slots: ['9:00 AM - 12:00 PM', '1:00 PM - 3:00 PM'] },
];

// Earnings data
const EARNINGS_DATA = {
  today: '$240',
  thisWeek: '$1,680',
  thisMonth: '$6,320',
  average: '$210 / session'
};

// Constants for calendar marked dates
const today = new Date();
const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

// Define proper types for calendar marked dates
interface MarkedDates {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean;
    dotColor?: string;
  };
}

// Get upcoming appointment dates for calendar highlighting
const markedDates: MarkedDates = {};
markedDates[todayString] = { selected: true, selectedColor: '#7F56D9' };

APPOINTMENTS.forEach(appointment => {
  if (appointment.date !== todayString) {
    markedDates[appointment.date] = { 
      marked: true, 
      dotColor: appointment.status === 'confirmed' ? '#7F56D9' : '#FFA500'
    };
  }
});

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [notifications, setNotifications] = useState(3);
  
  const isWeb = Platform.OS === 'web';
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;

  // Filter appointments for selected date
  const filteredAppointments = APPOINTMENTS.filter(apt => apt.date === selectedDate);

  // Define a type for the calendar day press event
  interface CalendarDayObject {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  }

  const handleCalendarDayPress = (day: CalendarDayObject) => {
    setSelectedDate(day.dateString);
  };
  
  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
  };

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeText}>Welcome back, Dr. Sarah</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={styles.statusContainer}>
          <TouchableOpacity 
            style={[styles.statusButton, isAvailable ? styles.statusActive : styles.statusInactive]}
            onPress={() => setIsAvailable(!isAvailable)}
          >
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>{EARNINGS_DATA.today}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>{EARNINGS_DATA.thisWeek}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{EARNINGS_DATA.thisMonth}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{EARNINGS_DATA.average}</Text>
        </View>
      </View>

      <View style={styles.upcomingContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => setActiveTab('calendar')}>
            <Text style={styles.viewAllText}>View Calendar</Text>
          </TouchableOpacity>
        </View>

        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appointment => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{appointment.patient.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{appointment.patient.name}</Text>
                    <Text style={styles.appointmentType}>{appointment.type}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge, 
                  appointment.status === 'confirmed' ? styles.confirmedBadge : styles.pendingBadge
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{new Date(appointment.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>
                
                {appointment.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.appointmentActions}>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Join Session</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#A0AEC0" />
            <Text style={styles.emptyStateText}>No appointments scheduled for today</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => openModal('availability')}>
              <Text style={styles.primaryButtonText}>Update Availability</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.tabContent}>
      <View style={styles.calendarContainer}>
        <View style={styles.calendarCard}>
          <Calendar
            style={styles.calendar}
            theme={{
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#7F56D9',
              selectedDayBackgroundColor: '#7F56D9',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#7F56D9',
              dayTextColor: '#2D3748',
              textDisabledColor: '#CBD5E0',
              dotColor: '#7F56D9',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#7F56D9',
              monthTextColor: '#2D3748',
              indicatorColor: '#7F56D9',
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12
            }}
            markedDates={markedDates}
            onDayPress={handleCalendarDayPress}
            enableSwipeMonths={true}
          />

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#7F56D9'}]} />
              <Text style={styles.legendText}>Confirmed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#FFA500'}]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openModal('availability')}
          >
            <Ionicons name="time-outline" size={20} color="#7F56D9" />
            <Text style={styles.actionButtonText}>Update Availability</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="sync-outline" size={20} color="#7F56D9" />
            <Text style={styles.actionButtonText}>Sync Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dayScheduleContainer}>
        <Text style={styles.dayScheduleTitle}>
          {new Date(selectedDate).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
        </Text>

        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appointment => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{appointment.patient.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{appointment.patient.name}</Text>
                    <Text style={styles.appointmentType}>{appointment.type}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge, 
                  appointment.status === 'confirmed' ? styles.confirmedBadge : styles.pendingBadge
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>
                
                {appointment.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.appointmentActions}>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Join Session</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#A0AEC0" />
            <Text style={styles.emptyStateText}>No appointments scheduled for this day</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => openModal('blockTime')}>
              <Text style={styles.primaryButtonText}>Block Time Off</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderPatients = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            placeholderTextColor="#6B7280"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={20} color="#7F56D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.patientsList}>
        {APPOINTMENTS.map(appointment => (
          <TouchableOpacity key={appointment.id} style={styles.patientCard}>
            <View style={styles.patientCardHeader}>
              <View style={styles.patientInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{appointment.patient.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{appointment.patient.name}</Text>
                  <Text style={styles.patientMeta}>Last session: {new Date(appointment.date).toLocaleDateString()}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.settingsTitle}>Account Settings</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Profile Information</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Name</Text>
            <Text style={styles.settingValue}>Dr. Sarah Johnson</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>sarah.johnson@example.com</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Specialization</Text>
            <Text style={styles.settingValue}>Clinical Psychology</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>License Number</Text>
            <Text style={styles.settingValue}>PSY12345</Text>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Session Settings</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItemRow}>
            <Text style={styles.settingLabel}>Session Duration</Text>
            <Text style={styles.settingValue}>50 minutes</Text>
          </View>
          
          <View style={styles.settingItemRow}>
            <Text style={styles.settingLabel}>Buffer Time</Text>
            <Text style={styles.settingValue}>10 minutes</Text>
          </View>
          
          <View style={styles.settingItemRow}>
            <Text style={styles.settingLabel}>Session Rate</Text>
            <Text style={styles.settingValue}>$150 / hour</Text>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Session Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Notifications</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItemToggle}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Switch
              value={true}
              trackColor={{ false: '#E2E8F0', true: '#DBD1F8' }}
              thumbColor={true ? '#7F56D9' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItemToggle}>
            <Text style={styles.settingLabel}>SMS Notifications</Text>
            <Switch
              value={true}
              trackColor={{ false: '#E2E8F0', true: '#DBD1F8' }}
              thumbColor={true ? '#7F56D9' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItemToggle}>
            <Text style={styles.settingLabel}>App Notifications</Text>
            <Switch
              value={true}
              trackColor={{ false: '#E2E8F0', true: '#DBD1F8' }}
              thumbColor={true ? '#7F56D9' : '#F4F3F4'}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderModal = () => {
    if (modalType === 'availability') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Update Availability</Text>
          
          <View style={styles.availabilityForm}>
            {AVAILABILITY.map((item, index) => (
              <View key={index} style={styles.availabilityDay}>
                <Text style={styles.availabilityDayName}>{item.day}</Text>
                
                <View style={styles.availabilitySlots}>
                  {item.slots.map((slot, slotIndex) => (
                    <View key={slotIndex} style={styles.availabilitySlot}>
                      <Text style={styles.availabilitySlotText}>{slot}</Text>
                      <TouchableOpacity>
                        <Ionicons name="close-circle" size={20} color="#E53E3E" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity style={styles.addSlotButton}>
                    <Ionicons name="add-circle-outline" size={20} color="#7F56D9" />
                    <Text style={styles.addSlotText}>Add Time Slot</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    if (modalType === 'blockTime') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Block Time Off</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date</Text>
            <View style={styles.formInput}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.formInputText}>{selectedDate}</Text>
            </View>
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, {flex: 1, marginRight: 10}]}>
              <Text style={styles.formLabel}>Start Time</Text>
              <View style={styles.formInput}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.formInputText}>9:00 AM</Text>
              </View>
            </View>
            
            <View style={[styles.formGroup, {flex: 1, marginLeft: 10}]}>
              <Text style={styles.formLabel}>End Time</Text>
              <View style={styles.formInput}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.formInputText}>5:00 PM</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Reason (Optional)</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Add details about why you're blocking this time..."
              placeholderTextColor="#6B7280"
            />
          </View>
          
          <View style={styles.formCheck}>
            <Switch
              value={true}
              trackColor={{ false: '#E2E8F0', true: '#DBD1F8' }}
              thumbColor={true ? '#7F56D9' : '#F4F3F4'}
            />
            <Text style={styles.formCheckLabel}>Recurring event</Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.saveButtonText}>Block Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, isWeb && !isMobile && styles.webLayout]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, isWeb && !isMobile && styles.webSidebar]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.logo}>Uniwell</Text>
          </View>
          
          <View style={styles.sidebarNav}>
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'dashboard' && styles.activeNavItem]}
              onPress={() => setActiveTab('dashboard')}
            >
              <Ionicons 
                name={activeTab === 'dashboard' ? "home" : "home-outline"} 
                size={24} 
                color={activeTab === 'dashboard' ? "#7F56D9" : "#4A5568"} 
              />
              {(!isWeb || !isMobile) && (
                <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>
                  Dashboard
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'calendar' && styles.activeNavItem]}
              onPress={() => setActiveTab('calendar')}
            >
              <Ionicons 
                name={activeTab === 'calendar' ? "calendar" : "calendar-outline"} 
                size={24} 
                color={activeTab === 'calendar' ? "#7F56D9" : "#4A5568"} 
              />
              {(!isWeb || !isMobile) && (
                <Text style={[styles.navText, activeTab === 'calendar' && styles.activeNavText]}>
                  Calendar
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'patients' && styles.activeNavItem]}
              onPress={() => setActiveTab('patients')}
            >
              <Ionicons 
                name={activeTab === 'patients' ? "people" : "people-outline"} 
                size={24} 
                color={activeTab === 'patients' ? "#7F56D9" : "#4A5568"} 
              />
              {(!isWeb || !isMobile) && (
                <Text style={[styles.navText, activeTab === 'patients' && styles.activeNavText]}>
                  Patients
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
              onPress={() => setActiveTab('settings')}
            >
              <Ionicons 
                name={activeTab === 'settings' ? "settings" : "settings-outline"} 
                size={24} 
                color={activeTab === 'settings' ? "#7F56D9" : "#4A5568"} 
              />
              {(!isWeb || !isMobile) && (
                <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>
                  Settings
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>SJ</Text>
            </View>
            {(!isWeb || !isMobile) && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Dr. Sarah Johnson</Text>
                <Text style={styles.profileTitle}>Clinical Psychologist</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <View style={styles.main}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.pageTitle}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'calendar' && 'Calendar'}
                {activeTab === 'patients' && 'Patients'}
                {activeTab === 'settings' && 'Settings'}
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="notifications-outline" size={24} color="#4A5568" />
                {notifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{notifications}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="help-circle-outline" size={24} color="#4A5568" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Content Based on Active Tab */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'patients' && renderPatients()}
            {activeTab === 'settings' && renderSettings()}
          </ScrollView>
        </View>
      </View>
      
      {/* Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#4A5568" />
              </TouchableOpacity>
            </View>
            {renderModal()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  layout: {
    flex: 1,
    flexDirection: 'column',
  },
  webLayout: {
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
  },
  webSidebar: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    borderBottomWidth: 0,
    height: '100%',
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7F56D9',
  },
  sidebarNav: {
    flexDirection: Platform.OS === 'web' ? 'column' : 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: Platform.OS === 'web' ? 8 : 0,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: '#F9F5FF',
  },
  navText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#4A5568',
  },
  activeNavText: {
    color: '#7F56D9',
    fontWeight: '600',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: Platform.OS === 'web' ? 1 : 0,
    borderTopColor: '#E2E8F0',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7F56D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  profileInfo: {
    marginLeft: 12,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: 'SF-Regular',
  },
  profileTitle: {
    fontSize: 12,
    color: '#718096',
    fontFamily: 'SF-Regular',
  },
  main: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    fontFamily: 'SF-Regular',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: 'SF-Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  tabContent: {
    padding: 20,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
    fontFamily: 'SF-Regular',
  },
  dateText: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'SF-Regular',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
    fontFamily: 'SF-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontFamily: 'SF-Regular',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: 'SF-Regular',
  },
  upcomingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: 'SF-Regular',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F56D9',
    fontFamily: 'SF-Regular',
  },
  appointmentCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#3182CE',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
    fontFamily: 'SF-Regular',
  },
  appointmentType: {
    fontSize: 14,
    color: '#718096',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  confirmedBadge: {
    backgroundColor: '#EBF8FF',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
    fontFamily: 'SF-Regular',
  },
  notesSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 4,
    fontFamily: 'SF-Regular',
  },
  notesText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    fontFamily: 'SF-Regular',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#7F56D9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    marginVertical: 16,
    textAlign: 'center',
    fontFamily: 'SF-Regular',
  },
  calendarContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    marginBottom: 24,
  },
  calendarCard: {
    flex: Platform.OS === 'web' ? 2 : undefined,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginRight: Platform.OS === 'web' ? 16 : 0,
    marginBottom: Platform.OS === 'web' ? 0 : 16,
  },
  calendar: {
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#718096',
    fontFamily: 'SF-Regular',
  },
  calendarActions: {
    flex: Platform.OS === 'web' ? 1 : undefined,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
    marginLeft: 12,
  },
  dayScheduleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayScheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
    fontFamily: 'SF-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
    marginLeft: 8,
    fontFamily: 'SF-Regular',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientMeta: {
    fontSize: 12,
    color: '#718096',
    fontFamily: 'SF-Regular',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 24,
    fontFamily: 'SF-Regular',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 12,
    fontFamily: 'SF-Regular',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingItemToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
    fontFamily: 'SF-Regular',
  },
  settingValue: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#F7FAFC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  editButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Platform.OS === 'web' ? '60%' : '90%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 20,
    fontFamily: 'SF-Regular',
  },
  availabilityForm: {
    marginBottom: 20,
  },
  availabilityDay: {
    marginBottom: 16,
  },
  availabilityDayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    fontFamily: 'SF-Regular',
  },
  availabilitySlots: {
    marginLeft: 16,
  },
  availabilitySlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  availabilitySlotText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addSlotText: {
    fontSize: 14,
    color: '#7F56D9',
    fontWeight: '500',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#7F56D9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontFamily: 'SF-Regular',
  },
  formInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F7FAFC',
  },
  formInputText: {
    fontSize: 14,
    color: '#2D3748',
    marginLeft: 8,
    fontFamily: 'SF-Regular',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#2D3748',
    fontFamily: 'SF-Regular',
  },
  formCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formCheckLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
    fontFamily: 'SF-Regular',
  },
});