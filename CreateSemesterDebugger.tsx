import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTimetableManagement } from './lib/useTimeTableManagement';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/AuthContext';
import { SemesterType } from './types/TimetableTypes';
import DateTimePicker from '@react-native-community/datetimepicker';
import  ErrorBoundary  from 'react-native-error-boundary';
import {AuthContext} from './contexts/AuthContext';
import { format } from 'date-fns';
// Error Fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const fallbackStyles = StyleSheet.create({
    errorContainer: {
      padding: 16,
      backgroundColor: '#ffcccc',
      borderRadius: 8,
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'red',
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: 'red',
      marginBottom: 8,
    },
  });

  return (
    <View style={fallbackStyles.errorContainer}>
      <Text style={fallbackStyles.errorTitle}>Something went wrong:</Text>
      <Text style={fallbackStyles.errorMessage}>{error.message}</Text>
      <Button title="Try again" onPress={resetErrorBoundary} />
    </View>
  );
};

const CreateSemesterDebugger = () => {
  // State for form inputs
  const [semesterName, setSemesterName] = useState('');
  const [semesterType, setSemesterType] = useState<SemesterType>('REGULAR' as SemesterType);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)); // Default to 90 days later
  
  // State for debugging info
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supabaseResponse, setSupabaseResponse] = useState<any>(null);
  const [snakeCaseTestResult, setSnakeCaseTestResult] = useState<any>(null);
  const [userIdTestResult, setUserIdTestResult] = useState<any>(null);
  const [dateFormatTestResult, setDateFormatTestResult] = useState<any>(null);
  const [directInsertResult, setDirectInsertResult] = useState<any>(null);
  // Get the timetable management hook and auth context
  const { createSemester } = useTimetableManagement();
  const {currentUser, session} = useContext(AuthContext);
  const user = currentUser || { id: 'placeholder', email: 'placeholder@example.com' };
  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry); // Also log to console for more debugging options
    setLogs(prevLogs => [logEntry, ...prevLogs]);
  };

  // Check authentication status
  useEffect(() => {
    checkAuth();
  }, [user, session]);

  const checkAuth = () => {
    addLog('Checking authentication status...');
    if (user) {
      addLog(`✅ Authenticated as: ${user.email}`);
    } else {
      addLog('❌ Not authenticated. User must be logged in to create semesters.');
    }
  };
  // Test direct Supabase connection
  const testSupabaseConnection = async () => {
    addLog('Testing direct Supabase connection...');
    setIsLoading(true);
    
    try {
      // Try to fetch something simple to test the connection
      const { data, error } = await supabase.from('semesters').select('count').limit(1);
      
      if (error) {
        addLog(`❌ Supabase connection test failed: ${error.message}`);
        setError(error.message);
      } else {
        addLog('✅ Supabase connection successful');
        addLog(`Response: ${JSON.stringify(data)}`);
      }
      
      setSupabaseResponse({ data, error });
    } catch (err: any) {
      addLog(`❌ Exception during Supabase test: ${err.message}`);
      setError(err.message);
      setSupabaseResponse({ error: err });
    } finally {
      setIsLoading(false);
      }
    };
    // Test if userId is properly passed to Supabase
  
  
    const testUserIdPassing = async () => {
        setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('User must be logged in to run this test');
      }
      
      // Create a special semester for this test
      const testData = {
        name: `UserID Test ${new Date().toISOString()}`,
        type: semesterType,
        startDate: startDate,
        endDate: endDate,
        status: 'inactive',
      };
      addLog(`Creating semester with test data: ${JSON.stringify(testData)}`);
      
      // Call the createSemester function
      const response = await createSemester({ ...testData, status: 'inactive' as 'inactive' });
      // Check if the created semester has the correct user_id
      if (response && response.id) {
        // Now fetch the semester directly from Supabase to verify user_id
        const { data, error: fetchError } = await supabase
          .from('semesters')
          .select('*')
          .eq('id', response.id)
          .single();
        
        if (fetchError) {
          throw new Error(`Failed to verify user_id: ${fetchError.message}`);
        }
        
        addLog(`Semester data from Supabase: ${JSON.stringify(data)}`);
        
        if (data.user_id === user.id) {
          addLog('✅ User ID test passed! Correct user_id was stored in the database');
          setUserIdTestResult({ passed: true, data });
        } else {
          addLog(`❌ User ID test failed! Expected user_id: ${user.id}, Got: ${data.user_id}`);
          setUserIdTestResult({ passed: false, expected: user.id, actual: data.user_id });
        }
      } else {
        throw new Error('Failed to create semester for user_id test');
      }
    } catch (err: unknown) {
      addLog(`❌ User ID test error: ${(err as Error).message}`);
      addLog(`❌ User ID test error: ${(err as Error).message}`);
      setUserIdTestResult({ passed: false, error: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  const testDateFormatting = async () => {
    addLog('Testing if dates are properly formatted for Supabase (YYYY-MM-DD)...');
    setIsLoading(true);
    
    try {
      // Format dates in the expected format
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      addLog(`Formatted start date: ${formattedStartDate}`);
      addLog(`Formatted end date: ${formattedEndDate}`);
      
      // Create a semester with these dates
      const testData = {
        name: `Date Format Test ${new Date().toISOString()}`,
        type: semesterType,
        startDate: startDate, // Using Date object
        endDate: endDate, // Using Date object
        status: 'inactive',
      };
      
      // Call the createSemester function
      const response = await createSemester({ ...testData, status: 'inactive' });
      
      if (response && response.id) {
        // Now fetch the semester directly from Supabase to check date format
        const { data, error: fetchError } = await supabase
          .from('semesters')
          .select('*')
          .eq('id', response.id)
          .single();
        
        if (fetchError) {
          throw new Error(`Failed to verify date format: ${fetchError.message}`);
        }
        
        addLog(`Semester data from Supabase: ${JSON.stringify(data)}`);
        
        // Check if the dates in the database match our expected format
        const dbStartDate = data.start_date;
        const dbEndDate = data.end_date;
        
        // Verify dates are in YYYY-MM-DD format using regex
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const startFormatCorrect = dateRegex.test(dbStartDate);
        const endFormatCorrect = dateRegex.test(dbEndDate);
        
        if (startFormatCorrect && endFormatCorrect) {
          addLog('✅ Date format test passed! Dates are stored in YYYY-MM-DD format');
          setDateFormatTestResult({ passed: true, data });
        } else {
          addLog(`❌ Date format test failed! Dates are not in YYYY-MM-DD format`);
          setDateFormatTestResult({ 
            passed: false, 
            startDate: { value: dbStartDate, correct: startFormatCorrect },
            endDate: { value: dbEndDate, correct: endFormatCorrect }
          });
        }
      } else {
        throw new Error('Failed to create semester for date format test');
      }
    } catch (err) {
      addLog(`❌ Date format test error: ${(err as Error).message}`);
      addLog(`❌ Date format test error: ${(err as Error).message}`);
      setDateFormatTestResult({ passed: false, error: (err as Error).message });
      setIsLoading(false);
    }
  };
  
  // Test if request is properly formatted in snake_case
  const testSnakeCaseFormatting = async () => {
    addLog('Testing if request to Supabase is properly formatted in snake_case...');
    setIsLoading(true);
    
    try {
      // Intercept the Supabase call by making a test API call and examining the request
      // We'll create a test semester with camelCase properties and check if they're converted to snake_case
      
      const testData = {
        name: `Snake Case Test ${new Date().toISOString()}`,
        type: semesterType,
        startDate: startDate, // camelCase
        endDate: endDate, // camelCase
        isActive: false, // camelCase
        userId: user?.id, // camelCase
        createdAt: new Date(), // camelCase
      };
      
      addLog(`Testing with camelCase data: ${JSON.stringify(testData)}`);
      
      // Mock the actual API call to see what's being sent
      // This is a direct call to Supabase to debug what's happening
      const { data, error } = await supabase.from('semesters').insert({
        name: testData.name,
        type: testData.type,
        start_date: format(testData.startDate, 'yyyy-MM-dd'), // Manually convert to snake_case
        end_date: format(testData.endDate, 'yyyy-MM-dd'), // Manually convert to snake_case
        is_active: testData.isActive, // Manually convert to snake_case
        user_id: testData.userId, // Manually convert to snake_case
        created_at: testData.createdAt.toISOString() // Manually convert to snake_case
      }).select();
      
    if (error) {
      addLog(`❌ Snake case test insertion error: ${error.message}`);
      setSnakeCaseTestResult({ passed: false, error: error.message });
    } else {
      // Now check the actual createSemester function
      const response = await createSemester({
        name: testData.name,
        type: testData.type,
        startDate: testData.startDate,
        endDate: testData.endDate,
        status: 'inactive',
      });

      if (response && 'error' in response && response.error) {
        const errorMessage = typeof response.error === 'object' && 'message' in response.error 
          ? (response.error as { message: string }).message 
          : 'Unknown error';
        addLog(`❌ createSemester function failed during snake_case test: ${errorMessage}`);
        setSnakeCaseTestResult({ passed: false, error: errorMessage });
      } else if (response && 'data' in response && response.data) {
        addLog('✅ Snake case test passed! Semester created successfully with camelCase properties');
        setSnakeCaseTestResult({ passed: true, data: response.data });
      } else {
        addLog('❓ Snake case test inconclusive: No error but no data returned');
        setSnakeCaseTestResult({ passed: false, error: 'No data returned' });
      }
    }
  } catch (err) {
    addLog(`❌ Snake case test error: ${(err as Error).message}`);
    setSnakeCaseTestResult({ passed: false, error: (err as Error).message });
  } finally {
    setIsLoading(false);
  }
  
  // Direct Supabase insertion test bypassing the hook
  const testDirectSupabaseInsertion = async () => {
    addLog('Testing direct Supabase insertion bypassing the hook...');
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('User must be logged in to run this test');
      }
      
      // Create semester data directly formatted for Supabase
      const directData = {
        name: `Direct Insert Test ${new Date().toISOString()}`,
        type: semesterType.toLowerCase(),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        is_active: false,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      addLog(`Inserting directly to Supabase with: ${JSON.stringify(directData)}`);
      
      // Make direct API call to Supabase
      const { data, error } = await supabase
        .from('semesters')
        .insert(directData)
        .select();
      
      if (error) {
        addLog(`❌ Direct insertion failed: ${error.message}`);
        setDirectInsertResult({ passed: false, error: error.message });
      } else {
        addLog(`✅ Direct insertion successful: ${JSON.stringify(data)}`);
        setDirectInsertResult({ passed: true, data });
      }
    } catch (err) {
      addLog(`❌ Direct insertion error: ${(err as Error).message}`);
      setDirectInsertResult({ passed: false, error: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  // Validate the form data
  const validateForm = () => {
    addLog('Validating form data...');
    
    if (!semesterName.trim()) {
      addLog('❌ Semester name cannot be empty');
      return false;
    }
    
    if (startDate >= endDate) {
      addLog('❌ End date must be after start date');
      return false;
    }
    
    addLog('✅ Form validation passed');
    return true;
  };

  // Handle the create semester action
  const handleCreateSemester = async () => {
    setIsLoading(true);
    setIsSuccess(null);
    setError(null);
    setSupabaseResponse(null);
    
    addLog('------ STARTING CREATE SEMESTER PROCESS ------');
    addLog(`Semester Name: ${semesterName}`);
    addLog(`Semester Type: ${semesterType}`);
    addLog(`Start Date: ${startDate.toISOString()}`);
    addLog(`End Date: ${endDate.toISOString()}`);
    // Check authentication first
    if (!user) {
      addLog('❌ Not authenticated. Cannot create semester.');
      setError('User must be logged in');
      setIsLoading(false);
      setIsSuccess(false);
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      setIsLoading(false);
      setIsSuccess(false);
      return;
    }
    
    try {
      addLog('Calling createSemester function...');
      
      // Create the semester object
      const semesterData = {
        name: semesterName,
        type: semesterType,
        startDate: startDate,
        endDate: endDate,
        status: 'inactive' as 'inactive', // Ensure status is properly typed
      };
      addLog(`Sending data: ${JSON.stringify(semesterData)}`);
      
      // Call the createSemester function with detailed tracing
      const response = await createSemester(semesterData);
      
      if (!response) {
        addLog('❌ Create semester failed: Response is null');
        setError('Response is null');
        setIsSuccess(false);
        return;
      }

      addLog(`Response received: ${JSON.stringify(response)}`);
      setSupabaseResponse(response);
      
      if ('error' in response && response.error && typeof response.error === 'object' && 'message' in response.error) {
        const errorMessage = (response.error as { message: string }).message;
        addLog(`❌ Create semester failed: ${errorMessage}`);
        setError(errorMessage);
        setIsSuccess(false);
      } else {
        addLog('✅ Semester created successfully!');
        addLog(`Semester ID: ${response.id}`);
        setIsSuccess(true);
        
        // Reset form on success
        setSemesterName('');
      }
    } catch (err: any) {
      addLog(`❌ Exception during semester creation: ${(err as Error).message}`);
      setSupabaseResponse({ error: err });
    } finally {
      setIsLoading(false);
      addLog('------ COMPLETED CREATE SEMESTER PROCESS ------');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Semester Debugger</Text>
      
      {/* Authentication Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Status</Text>
        <Text>
          {user ? `Logged in as: ${user.email}` : 'Not logged in'}
        </Text>
        <Button 
          title="Check Authentication" 
          onPress={checkAuth} 
        />
        <Button
          title="Test Supabase Connection"
          onPress={testSupabaseConnection}
          color="#9c27b0"
        />
      </View>
      
      {/* Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Semester Form</Text>
        
        <Text style={styles.label}>Semester Name:</Text>
        <TextInput
          style={styles.input}
          value={semesterName}
          onChangeText={setSemesterName}
          placeholder="e.g., Fall 2023"
        />
        
        <Text style={styles.label}>Semester Type:</Text>
        <View style={styles.typeSelector}>
          <Button
            title="Regular"
            onPress={() => setSemesterType('REGULAR' as SemesterType)}
            color={semesterType === ('REGULAR' as SemesterType) ? '#4caf50' : '#999'}
          />
          <Button
            title="Summer"
            onPress={() => setSemesterType('SUMMER' as SemesterType)}
            color={semesterType === ('SUMMER' as SemesterType) ? '#4caf50' : '#999'}
          />
        </View>
        
        <Text style={styles.label}>Start Date:</Text>
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
        
        <Text style={styles.label}>End Date:</Text>
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
        
        <Button
          title={isLoading ? "Creating..." : "Create Semester"}
          onPress={handleCreateSemester}
          disabled={isLoading}
          color="#2196f3"
        />
        
        {isLoading && <ActivityIndicator size="large" color="#2196f3" />}
        
        {isSuccess !== null && (
          <Text style={isSuccess ? styles.success : styles.error}>
            {isSuccess ? "✅ Semester created successfully!" : `❌ Error: ${error}`}
          </Text>
        )}
      </View>
      
      {/* Results and Response */}
      {supabaseResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supabase Response</Text>
          <ScrollView style={styles.responseBox}>
            <Text>{JSON.stringify(supabaseResponse, null, 2)}</Text>
          </ScrollView>
        </View>
      )}
      
      {/* Logs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Logs</Text>
        <ScrollView style={styles.logBox}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  responseBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 200,
  },
  logBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 300,
  },
  logEntry: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
  success: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 8,
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffcccc',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: 'red',
    marginBottom: 8,
  },
  
});

}

export default CreateSemesterDebugger;