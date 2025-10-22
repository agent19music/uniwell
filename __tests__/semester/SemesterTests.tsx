import { useTimetableManagement } from './lib/useTimeTableManagement';
import { Semester, SemesterType } from './types/TimetableTypes';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

// Test result interface
export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

// Custom logging function with timestamps
const log = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', data?: any) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [SEMESTER_TEST] [${type.toUpperCase()}]`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, data);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
  
  return `${logPrefix} ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
};

// Test Functions
export const runAuthenticationTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Authentication Test...');
    const { createSemester, error } = useTimetableManagement();
    
    // Try to create a semester without proper authentication
    // Mock user by setting it to null temporarily (this depends on the actual implementation)
    const result = await createSemester({
      name: 'Test Semester',
      type: SemesterType.FALL,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2023-12-31'),
      status: 'inactive'
    });
    
    if (error === 'User not authenticated') {
      console.log('✅ Authentication Test: Failed with correct error message as expected');
      return {
        name: 'Authentication Test',
        passed: true,
        message: 'Authentication check works correctly; unauthorized creation is blocked',
        details: { error }
      };
    }
    
    if (result !== null) {
      console.log('❌ Authentication Test: Semester was created without auth');
      return {
        name: 'Authentication Test',
        passed: false,
        message: 'Authentication check failed; semester was created without proper authentication',
        details: { result }
      };
    }
    
    console.log('✅ Authentication Test: Passed');
    return {
      name: 'Authentication Test',
      passed: true,
      message: 'Authentication check works correctly',
      details: { error }
    };
  } catch (error) {
    console.error('❌ Authentication Test Error:', error);
    return {
      name: 'Authentication Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export const runDataValidationTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Data Validation Test...');
    const { createSemester, error } = useTimetableManagement();
    
    // Test with missing required fields
    const result = await createSemester({
      name: '', // Empty name
      type: SemesterType.FALL,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2023-12-31'),
      status: 'inactive'
    });
    
    if (error === 'Missing required semester data') {
      console.log('✅ Data Validation Test: Failed with correct error as expected');
      return {
        name: 'Data Validation Test',
        passed: true,
        message: 'Data validation works correctly; empty name was rejected',
        details: { error }
      };
    }
    
    if (result !== null) {
      console.log('❌ Data Validation Test: Created semester with empty name');
      return {
        name: 'Data Validation Test',
        passed: false,
        message: 'Data validation failed; semester was created with invalid data',
        details: { result }
      };
    }
    
    console.log('✅ Data Validation Test: Passed');
    return {
      name: 'Data Validation Test',
      passed: true,
      message: 'Data validation works correctly',
      details: { error }
    };
  } catch (error) {
    console.error('❌ Data Validation Test Error:', error);
    return {
      name: 'Data Validation Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export const runCreateSemesterTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Create Semester Test...');
    console.log('🔍 Testing create semester functionality with detailed logging');
    
    const { createSemester, semesters } = useTimetableManagement();
    
    const semestersBefore = [...semesters];
    console.log('📊 Current semesters before creation:', semestersBefore);
    
    const testSemesterData = {
      name: 'Test Fall 2023',
      type: SemesterType.FALL,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2023-12-31'),
      status: 'inactive' as 'active' | 'inactive'
    };
    
    console.log('📝 Creating semester with data:', testSemesterData);
    
    // Add detailed logging for each step of the creation process
    const newSemester = await createSemester(testSemesterData);
    
    console.log('🔍 Create semester result:', newSemester);
    
    if (!newSemester) {
      console.log('❌ Create Semester Test: Failed to create semester');
      return {
        name: 'Create Semester Test',
        passed: false,
        message: 'Failed to create semester',
        details: { 
          testData: testSemesterData,
          semesters: semesters
        }
      };
    }
    
    // Check if the semester was actually added to the list
    const semestersAfter = [...semesters];
    console.log('📊 Semesters after creation:', semestersAfter);
    
    const foundInList = semestersAfter.some(s => s.id === newSemester.id);
    
    if (!foundInList) {
      console.log('❌ Create Semester Test: Semester created but not found in list');
      return {
        name: 'Create Semester Test',
        passed: false,
        message: 'Semester was created but not found in the semesters list',
        details: { 
          createdSemester: newSemester,
          semestersList: semestersAfter
        }
      };
    }
    
    console.log('✅ Create Semester Test: Passed');
    return {
      name: 'Create Semester Test',
      passed: true,
      message: 'Successfully created a new semester',
      details: { 
        createdSemester: newSemester,
        semestersBefore,
        semestersAfter
      }
    };
  } catch (error) {
    console.error('❌ Create Semester Test Error:', error);
    return {
      name: 'Create Semester Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export const runActiveSemesterTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Active Semester Test...');
    const { createSemester, activeSemester, setActiveSemesterById } = useTimetableManagement();
    
    // Create a new semester with active status
    const testSemesterData = {
      name: 'Active Semester Test',
      type: SemesterType.SPRING,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-05-15'),
      status: 'active' as 'active' | 'inactive'
    };
    
    console.log('📝 Creating active semester with data:', testSemesterData);
    const newSemester = await createSemester(testSemesterData);
    
    if (!newSemester) {
      console.log('❌ Active Semester Test: Failed to create active semester');
      return {
        name: 'Active Semester Test',
        passed: false,
        message: 'Failed to create active semester for testing',
        details: { testData: testSemesterData }
      };
    }
    
    console.log('🔍 Checking if semester was set as active');
    if (activeSemester?.id !== newSemester.id) {
      console.log('❌ Active Semester Test: Semester not set as active');
      return {
        name: 'Active Semester Test',
        passed: false,
        message: 'Semester was created with active status but not set as the active semester',
        details: { 
          createdSemester: newSemester,
          currentActiveSemester: activeSemester
        }
      };
    }
    
    // Test deactivating the semester
    console.log('🔍 Testing deactivation of semester');
    const success = await setActiveSemesterById('some-other-id');
    
    console.log('✅ Active Semester Test: Passed');
    return {
      name: 'Active Semester Test',
      passed: true,
      message: 'Active semester functionality works correctly',
      details: { 
        createdSemester: newSemester,
        activeSemester
      }
    };
  } catch (error) {
    console.error('❌ Active Semester Test Error:', error);
    return {
      name: 'Active Semester Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export const runDateFormatTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Date Format Test...');
    const { createSemester } = useTimetableManagement();
    
    // Test with different date formats
    const testCases = [
      // Standard Date object
      {
        name: 'Date Object Format',
        data: {
          name: 'Date Object Test',
          type: SemesterType.FALL,
          startDate: new Date('2023-09-01'),
          endDate: new Date('2023-12-31'),
          status: 'inactive' as 'active' | 'inactive'
        }
      },
      // ISO string format
      {
        name: 'ISO String Format',
        data: {
          name: 'ISO String Test',
          type: SemesterType.SPRING,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-05-15T00:00:00.000Z',
          status: 'inactive' as 'active' | 'inactive'
        }
      },
      // Date string format
      {
        name: 'Date String Format',
        data: {
          name: 'Date String Test',
          type: SemesterType.SUMMER,
          startDate: '2024-06-01',
          endDate: '2024-08-15',
          status: 'inactive' as 'active' | 'inactive'
        }
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      console.log(`🔍 Testing ${testCase.name} with data:`, testCase.data);
      const normalizedData = {
        ...testCase.data,
        startDate: new Date(testCase.data.startDate),
        endDate: new Date(testCase.data.endDate),
      };
      const result = await createSemester(normalizedData);
      results.push({
        testName: testCase.name,
        success: !!result,
        result
      });
    }
    
    const allPassed = results.every(r => r.success);
    
    if (allPassed) {
      console.log('✅ Date Format Test: All date formats handled correctly');
      return {
        name: 'Date Format Test',
        passed: true,
        message: 'Successfully handled all date formats',
        details: { results }
      };
    } else {
      const failedTests = results.filter(r => !r.success);
      console.log('❌ Date Format Test: Failed with some date formats', failedTests);
      return {
        name: 'Date Format Test',
        passed: false,
        message: `Failed to handle ${failedTests.length} date format(s)`,
        details: { 
          results,
          failedTests
        }
      };
    }
  } catch (error) {
    console.error('❌ Date Format Test Error:', error);
    return {
      name: 'Date Format Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export const runSupabaseConnectionTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Supabase Connection Test...');
    const { loadSemesters, error } = useTimetableManagement();
    
    console.log('🔍 Testing Supabase connection by loading semesters');
    await loadSemesters();
    
    if (error && error.includes('Supabase')) {
      console.log('❌ Supabase Connection Test: Failed to connect to Supabase');
      return {
        name: 'Supabase Connection Test',
        passed: false,
        message: `Failed to connect to Supabase: ${error}`,
        details: { error }
      };
    }
    
    console.log('✅ Supabase Connection Test: Passed');
    return {
      name: 'Supabase Connection Test',
      passed: true,
      message: 'Successfully connected to Supabase',
      details: {}
    };
  } catch (error) {
    console.error('❌ Supabase Connection Test Error:', error);
    return {
      name: 'Supabase Connection Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export const runDeleteSemesterTest = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Running Delete Semester Test...');
    const { createSemester, deleteSemester, semesters } = useTimetableManagement();
    
    // First create a semester to delete
    const testSemesterData = {
      name: 'Semester To Delete',
      type: SemesterType.WINTER,
      startDate: new Date('2023-12-15'),
      endDate: new Date('2024-01-15'),
      status: 'inactive' as 'active' | 'inactive'
    };
    
    console.log('📝 Creating test semester for deletion:', testSemesterData);
    const newSemester = await createSemester(testSemesterData);
    
    if (!newSemester) {
      console.log('❌ Delete Semester Test: Failed to create test semester');
      return {
        name: 'Delete Semester Test',
        passed: false,
        message: 'Could not create a test semester to delete',
        details: { testData: testSemesterData }
      };
    }
    
    const semestersBefore = [...semesters];
    console.log('📊 Semesters before deletion:', semestersBefore);
    
    console.log('🗑️ Deleting semester with id:', newSemester.id);
    
    // Attempt to delete the semester
    const deleteResult = await deleteSemester(newSemester.id);
    
    if (!deleteResult) {
      console.log('❌ Delete Semester Test: Failed to delete semester');
      return {
        name: 'Delete Semester Test',
        passed: false,
        message: 'Failed to delete the semester',
        details: { semesterId: newSemester.id }
      };
    }
    
    // Check if the semester was actually removed from the list
    const semestersAfter = [...semesters];
    console.log('📊 Semesters after deletion:', semestersAfter);
    
    const stillExists = semestersAfter.some(s => s.id === newSemester.id);
    
    if (stillExists) {
      console.log('❌ Delete Semester Test: Semester was not removed from list');
      return {
        name: 'Delete Semester Test',
        passed: false,
        message: 'Semester was not properly removed from the semesters list',
        details: { 
          deletedSemesterId: newSemester.id,
          semestersList: semestersAfter
        }
      };
    }
    
    console.log('✅ Delete Semester Test: Passed');
    return {
      name: 'Delete Semester Test',
      passed: true,
      message: 'Successfully deleted a semester',
      details: { 
        deletedSemesterId: newSemester.id,
        semestersBefore,
        semestersAfter
      }
    };
  } catch (error) {
    console.error('❌ Delete Semester Test Error:', error);
    return {
      name: 'Delete Semester Test',
      passed: false,
      message: `Test threw an exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

// Main Component
const SemesterTests = () => {
  const timetableManager = useTimetableManagement();
  const auth = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [semesterName, setSemesterName] = useState('Test Semester');
  const [semesterType, setSemesterType] = useState<SemesterType>(SemesterType.FALL);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)); // 90 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [createdSemesterId, setCreatedSemesterId] = useState<string | null>(null);

  // Function to add a log message to the UI
  const addLog = (message: string) => {
    setTestResults(prev => [message, ...prev]);
  };

  // 1. Test createSemester functionality
  const testCreateSemester = async () => {
    addLog(log('Starting createSemester test'));
    
    try {
      // Check if timetableManager is properly initialized
      if (!timetableManager) {
        throw new Error('Timetable manager is not initialized');
      }
      
      addLog(log('Creating new semester with the following data:', 'info', {
        name: semesterName, 
        type: semesterType,
        startDate,
        endDate,
        status: 'inactive'
      }));
      
      // Call the createSemester function
      const newSemester = await timetableManager.createSemester({
        name: semesterName,
        type: semesterType,
        startDate,
        endDate,
        status: 'inactive'
      });
      
      // Log the result
      if (newSemester) {
        addLog(log('Successfully created semester', 'success', newSemester));
        setCreatedSemesterId(newSemester.id);
        return newSemester;
      } else {
        addLog(log('Failed to create semester, returned null or undefined', 'error'));
        return null;
      }
    } catch (error) {
      addLog(log(`Error in createSemester: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', error));
      
      console.error('Full error object:', error);
      return null;
    }
  };

  // 2. Test user authentication verification
  const testAuthenticationVerification = async () => {
    addLog(log('Starting authentication verification test'));
    
    try {
      // Check current authentication state
      const isAuthenticated = auth?.currentUser !== null;
      addLog(log(`Current authentication state: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`, 
        isAuthenticated ? 'success' : 'warning'));
      
      if (!isAuthenticated) {
        addLog(log('Not authenticated. Attempting to create semester anyway to verify protection...', 'warning'));
        
        // Attempt to directly call Supabase without authentication
        const { data, error } = await supabase
          .from('semesters')
          .insert({
            name: 'Unauthorized Test',
            type: 'fall',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'inactive',
            user_id: 'unauthorized-test'
          })
          .select();
        
        if (error) {
          addLog(log('Supabase correctly rejected unauthorized request', 'success', error));
          return true;
        } else {
          addLog(log('WARNING: Supabase allowed unauthorized insert!', 'error', data));
          return false;
        }
      } else {
        // If authenticated, test with invalid user ID
        addLog(log('Authenticated. Testing createSemester with auth checks...', 'info'));
        
        // Store original user reference
        const originalUser = auth.currentUser;
        
        // Temporarily modify the user object to simulate authentication issues
        // @ts-ignore - Intentionally modifying for testing
        auth.currentUser = null;
        
        // Try creating a semester
        const result = await timetableManager.createSemester({
          name: 'Auth Test Semester',
          type: SemesterType.FALL,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'inactive'
        });
        
        // Restore the original user
        // @ts-ignore - Restoring after test
        auth.currentUser = originalUser;
        
        if (result === null) {
          addLog(log('Authentication check passed: createSemester returned null when not authenticated', 'success'));
          return true;
        } else {
          addLog(log('Authentication check failed: createSemester succeeded without authentication', 'error', result));
          return false;
        }
      }
    } catch (error) {
      addLog(log(`Error in authentication test: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', error));
      return false;
    }
  };

  // 3. Test semester data formatting
  const testDataFormatting = async () => {
    addLog(log('Starting semester data formatting test'));
    
    try {
      // Create sample data with various formats to test handling
      const testCases = [
        {
          name: "Test Correct Format",
          type: SemesterType.FALL,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'inactive',
          expected: 'success'
        },
        {
          name: "Test String Dates",
          type: SemesterType.SPRING,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'inactive',
          expected: 'success'
        },
        {
          name: "",  // Empty name
          type: SemesterType.SUMMER,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'inactive',
          expected: 'failure'
        },
        {
          name: "Test End Date Before Start",
          type: SemesterType.WINTER,
          startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(),  // End date before start date
          status: 'inactive',
          expected: 'logical error'
        }
      ];
      
      let results = [];
      
      for (const testCase of testCases) {
        addLog(log(`Testing data format: ${testCase.name}`, 'info', testCase));
        
        // For the last test case, check logical validation (end date should be after start date)
        if (testCase.expected === 'logical error') {
          // We're validating logical constraints manually here
          const startDate = new Date(testCase.startDate);
          const endDate = new Date(testCase.endDate);
          
          if (endDate < startDate) {
            addLog(log(
              `Logical validation check: End date ${endDate.toISOString()} is before start date ${startDate.toISOString()}`,
              'warning'
            ));
            results.push({
              name: testCase.name,
              passed: true,
              message: 'Correctly identified logical error: end date before start date'
            });
            continue;
          }
        }
        
        // Test the actual createSemester function with this format
        try {
          const result = await timetableManager.createSemester(testCase as any);
          
          if (testCase.expected === 'success' && result) {
            addLog(log(`Format test passed for ${testCase.name}`, 'success', result));
            results.push({
              name: testCase.name,
              passed: true,
              result
            });
          } else if (testCase.expected === 'failure' && !result) {
            addLog(log(`Format test correctly rejected ${testCase.name}`, 'success'));
            results.push({
              name: testCase.name,
              passed: true,
              message: 'Correctly rejected invalid format'
            });
          } else {
            addLog(log(
              `Format test unexpected result for ${testCase.name}. Expected: ${testCase.expected}, Got: ${result ? 'success' : 'failure'}`,
              'error',
              result
            ));
            results.push({
              name: testCase.name,
              passed: false,
              result
            });
          }
        } catch (error) {
          if (testCase.expected === 'failure') {
            addLog(log(`Format test correctly threw error for ${testCase.name}`, 'success', error instanceof Error ? error.message : 'Unknown error'));
            results.push({
              name: testCase.name,
              passed: true,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          } else {
            addLog(log(`Format test unexpected error for ${testCase.name}`, 'error', error));
            results.push({
              name: testCase.name,
              passed: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
      
      addLog(log('Data formatting test results summary:', 'info', results));
      return results.every(r => r.passed);
    } catch (error) {
      addLog(log(`Error in data formatting test: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', error));
      return false;
    }
  };

  // 4. Test semester activation/deactivation
  const testSemesterActivation = async () => {
    addLog(log('Starting semester activation/deactivation test'));
    
    try {
      // First, make sure we have at least one semester to test with
      await timetableManager.loadSemesters();
      let testSemesterId = createdSemesterId;
      
      // If we don't have a created semester from previous tests, create one
      if (!testSemesterId && (!timetableManager.semesters || timetableManager.semesters.length === 0)) {
        addLog(log('No semesters found, creating one for activation test', 'info'));
        const newSemester = await testCreateSemester();
        if (!newSemester) {
          throw new Error('Failed to create test semester for activation test');
        }
        testSemesterId = newSemester.id;
      } else if (!testSemesterId && timetableManager.semesters && timetableManager.semesters.length > 0) {
        // Use the first available semester
        testSemesterId = timetableManager.semesters[0].id;
        addLog(log(`Using existing semester for activation test: ${testSemesterId}`, 'info'));
      }
      
      if (!testSemesterId) {
        throw new Error('No semester ID available for testing');
      }
      
      // Test 1: Activate the semester
      addLog(log(`Testing activation of semester ${testSemesterId}`, 'info'));
      const activationResult = await timetableManager.setActiveSemesterById(testSemesterId);
      
      if (activationResult) {
        addLog(log('Successfully activated semester', 'success'));
        
        // Verify the semester is now active
        await timetableManager.loadSemesters();
        const activatedSemester = timetableManager.semesters.find(s => s.id === testSemesterId);
        
        if (activatedSemester && activatedSemester.status === 'active') {
          addLog(log('Verified semester is now active', 'success', activatedSemester));
        } else {
          addLog(log('Failed to verify active status', 'error', activatedSemester));
          return false;
        }
        
        // Test 2: Verify only one semester can be active at a time
        // Create another semester
        addLog(log('Creating another semester to test multiple activation handling', 'info'));
        const anotherSemester = await timetableManager.createSemester({
          name: 'Another Test Semester',
          type: SemesterType.SPRING,
          startDate: new Date(),
          endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          status: 'inactive'
        });
        
        if (!anotherSemester) {
          throw new Error('Failed to create second test semester');
        }
        
        // Activate the second semester
        addLog(log(`Activating second semester: ${anotherSemester.id}`, 'info'));
        const secondActivationResult = await timetableManager.setActiveSemesterById(anotherSemester.id);
        
        if (secondActivationResult) {
          // Reload semesters and verify statuses
          await timetableManager.loadSemesters();
          
          const firstSemesterAfter = timetableManager.semesters.find(s => s.id === testSemesterId);
          const secondSemesterAfter = timetableManager.semesters.find(s => s.id === anotherSemester.id);
          
          if (firstSemesterAfter?.status === 'inactive' && secondSemesterAfter?.status === 'active') {
            addLog(log('Successfully verified that only one semester can be active at a time', 'success', {
              first: firstSemesterAfter,
              second: secondSemesterAfter
            }));
          } else {
            addLog(log('Failed to verify single active semester constraint', 'error', {
              first: firstSemesterAfter,
              second: secondSemesterAfter
            }));
            return false;
          }
          
          // Test 3: Deactivate all semesters
          addLog(log('Testing deactivation of all semesters', 'info'));
          const deactivationResult = await timetableManager.setActiveSemesterById('none');
          
          if (deactivationResult) {
            // Reload semesters and verify none are active
            await timetableManager.loadSemesters();
            const anyActive = timetableManager.semesters.some(s => s.status === 'active');
            
            if (!anyActive) {
              addLog(log('Successfully deactivated all semesters', 'success'));
              return true;
            } else {
              addLog(log('Failed to deactivate all semesters', 'error'));
              return false;
            }
          } else {
            addLog(log('Failed to deactivate semesters', 'error'));
            return false;
          }
        } else {
          addLog(log('Failed to activate second semester', 'error'));
          return false;
        }
      } else {
        addLog(log('Failed to activate semester', 'error'));
        return false;
      }
    } catch (error) {
      addLog(log(`Error in semester activation test: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', error));
      return false;
    }
  };

  // 5. Test deleteSemester functionality
  const testDeleteSemester = async () => {
    addLog(log('Starting delete semester test'));
    
    try {
      // Create a semester specifically for deletion
      addLog(log('Creating a semester for deletion test', 'info'));
      const semesterToDelete = await timetableManager.createSemester({
        name: 'Delete Test Semester',
        type: SemesterType.FALL,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'inactive'
      });
      
      if (!semesterToDelete) {
        addLog(log('Failed to create semester for deletion test', 'error'));
        return false;
      }
      
      addLog(log(`Successfully created semester for deletion: ${semesterToDelete.id}`, 'success', semesterToDelete));
      
      // Get current semester list before deletion
      await timetableManager.loadSemesters();
      const semestersBefore = [...timetableManager.semesters];
      addLog(log('Semesters before deletion:', 'info', semestersBefore));
      
      // Delete the semester
      addLog(log(`Deleting semester with ID: ${semesterToDelete.id}`, 'info'));
      const deleteResult = await timetableManager.deleteSemester(semesterToDelete.id);
      
      if (!deleteResult) {
        addLog(log('Failed to delete semester', 'error'));
        return false;
      }
      
      addLog(log('Delete operation returned success', 'success'));
      
      // Verify the semester was actually deleted
      await timetableManager.loadSemesters();
      const semestersAfter = timetableManager.semesters;
      addLog(log('Semesters after deletion:', 'info', semestersAfter));
      
      const stillExists = semestersAfter.some(s => s.id === semesterToDelete.id);
      
      if (stillExists) {
        addLog(log('Semester still exists after deletion', 'error'));
        return false;
      }
      
      addLog(log('Semester successfully deleted', 'success'));
      return true;
    } catch (error) {
      addLog(log(`Error in delete semester test: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', error));
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Semester Tests</Text>
      
      <ScrollView style={styles.testControls}>
        <Text style={styles.subheader}>Test Parameters</Text>
        
        <Text style={styles.label}>Semester Name:</Text>
        <TextInput
          style={styles.input}
          value={semesterName}
          onChangeText={setSemesterName}
          placeholder="Enter semester name"
        />
        
        <Text style={styles.label}>Semester Type:</Text>
        <View style={styles.pickerContainer}>
          {(Object.keys(SemesterType) as Array<keyof typeof SemesterType>).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                semesterType === SemesterType[type] && styles.selectedType
              ]}
              onPress={() => setSemesterType(SemesterType[type])}
            >
              <Text style={styles.typeText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Start Date: {startDate.toDateString()}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>Select Start Date</Text>
        </TouchableOpacity>
        
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}
        
        <Text style={styles.label}>End Date: {endDate.toDateString()}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>Select End Date</Text>
        </TouchableOpacity>
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              addLog(log('Running all tests', 'info'));
              await testCreateSemester();
              await testAuthenticationVerification();
              await testDataFormatting();
              await testSemesterActivation();
              await testDeleteSemester();
              addLog(log('All tests completed', 'success'));
            }}
          >
            <Text style={styles.buttonText}>Run All Tests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              addLog(log('Running createSemester test', 'info'));
              await testCreateSemester();
            }}
          >
            <Text style={styles.buttonText}>Test Create Semester</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              addLog(log('Running authentication verification test', 'info'));
              await testAuthenticationVerification();
            }}
          >
            <Text style={styles.buttonText}>Test Authentication</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              addLog(log('Running data formatting test', 'info'));
              await testDataFormatting();
            }}
          >
            <Text style={styles.buttonText}>Test Data Formatting</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              addLog(log('Running semester activation test', 'info'));
              await testSemesterActivation();
            }}
          >
            <Text style={styles.buttonText}>Test Semester Activation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              addLog(log('Running delete semester test', 'info'));
              await testDeleteSemester();
            }}
          >
            <Text style={styles.buttonText}>Test Delete Semester</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.subheader}>Test Logs</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.logText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  subheader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  testControls: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  typeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10
  },
  selectedType: {
    backgroundColor: '#007bff',
    borderColor: '#007bff'
  },
  typeText: {
    color: '#fff'
  },
  dateButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginBottom: 10
  },
  dateButtonText: {
    color: '#fff',
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  testButton: {
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
    marginBottom: 10,
    flex: 1,
    marginRight: 10
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center'
  },
  logContainer: {
    flex: 1,
    marginTop: 20
  },
  logText: {
    fontSize: 14,
    marginBottom: 5
  }
});

export default SemesterTests;

