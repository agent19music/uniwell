import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  useColorScheme,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  runAuthenticationTest, 
  runDataValidationTest, 
  runCreateSemesterTest, 
  runActiveSemesterTest, 
  runDateFormatTest, 
  runSupabaseConnectionTest,
  runDeleteSemesterTest,
  TestResult
} from './semesterTests';

type TestStatus = 'idle' | 'running' | 'completed' | 'error';
type TestType = 'authentication' | 'dataValidation' | 'createSemester' | 'activeSemester' | 'dateFormat' | 'supabaseConnection' | 'deleteSemester' | 'all';

const SemesterTestRunner: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // States for test results and status
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<TestType | null>(null);
  const [status, setStatus] = useState<TestStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Function to run a specific test
  const runTest = async (testType: TestType) => {
    try {
      setCurrentTest(testType);
      setStatus('running');
      setError(null);
      
      let testResult: TestResult | null = null;
      
      // Run the selected test
      switch (testType) {
        case 'authentication':
          testResult = await runAuthenticationTest();
          break;
        case 'dataValidation':
          testResult = await runDataValidationTest();
          break;
        case 'createSemester':
          testResult = await runCreateSemesterTest();
          break;
        case 'activeSemester':
          testResult = await runActiveSemesterTest();
          break;
        case 'dateFormat':
          testResult = await runDateFormatTest();
          break;
        case 'supabaseConnection':
          testResult = await runSupabaseConnectionTest();
          break;
        case 'deleteSemester':
          testResult = await runDeleteSemesterTest();
          break;
        case 'all':
          await runAllTests();
          return;
        default:
          throw new Error('Unknown test type');
      }
      
      if (testResult) {
        setResults(prev => [testResult, ...prev]);
      }
      
      setStatus('completed');
    } catch (err) {
      console.error('Test error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setCurrentTest(null);
    }
  };

  // Function to run all tests sequentially
  const runAllTests = async () => {
    try {
      setCurrentTest('all');
      setStatus('running');
      setError(null);
      
      // Clear previous results when running all tests
      setResults([]);
      
      // Run all tests in sequence
      const authResult = await runAuthenticationTest();
      setResults(prev => [authResult, ...prev]);
      
      const validationResult = await runDataValidationTest();
      setResults(prev => [validationResult, ...prev]);
      
      const createResult = await runCreateSemesterTest();
      setResults(prev => [createResult, ...prev]);
      
      const activeResult = await runActiveSemesterTest();
      setResults(prev => [activeResult, ...prev]);
      
      const dateResult = await runDateFormatTest();
      setResults(prev => [dateResult, ...prev]);
      
      const supabaseResult = await runSupabaseConnectionTest();
      setResults(prev => [supabaseResult, ...prev]);
      
      const deleteResult = await runDeleteSemesterTest();
      setResults(prev => [deleteResult, ...prev]);
      
      setStatus('completed');
    } catch (err) {
      console.error('Run all tests error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred while running all tests');
    } finally {
      setCurrentTest(null);
    }
  };

  // Function to clear all test results
  const clearResults = () => {
    setResults([]);
    setStatus('idle');
    setError(null);
  };

  // Render test button
  const renderTestButton = (
    title: string, 
    testType: TestType, 
    icon: string,
    isLoading: boolean
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.testButton,
          isDark ? styles.testButtonDark : styles.testButtonLight,
          isLoading && styles.disabledButton
        ]}
        onPress={() => runTest(testType)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={isDark ? '#fff' : '#000'} size="small" />
        ) : (
          <>
            <Ionicons 
              name={icon as any} 
              size={22} 
              color={isDark ? '#fff' : '#000'} 
            />
            <Text style={[
              styles.testButtonText,
              isDark ? styles.textDark : styles.textLight
            ]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render individual test result
  const renderTestResult = (result: TestResult, index: number) => {
    const isPassed = result.passed;
    
    return (
      <View 
        key={`${result.name}-${index}`} 
        style={[
          styles.resultCard,
          isDark ? styles.resultCardDark : styles.resultCardLight
        ]}
      >
        <View style={styles.resultHeader}>
          <View style={styles.resultTitleContainer}>
            <Ionicons 
              name={isPassed ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={isPassed ? '#4CAF50' : '#F44336'} 
              style={styles.resultIcon}
            />
            <Text style={[
              styles.resultTitle,
              isDark ? styles.textDark : styles.textLight
            ]}>
              {result.name}
            </Text>
          </View>
          <Text style={[
            styles.resultStatus,
            isPassed ? styles.passedText : styles.failedText
          ]}>
            {isPassed ? 'PASSED' : 'FAILED'}
          </Text>
        </View>
        
        <Text style={[
          styles.resultMessage,
          isDark ? styles.textDark : styles.textLight
        ]}>
          {result.message}
        </Text>
        
        {result.details && (
          <View style={styles.detailsContainer}>
            <Text style={[
              styles.detailsTitle,
              isDark ? styles.textDark : styles.textLight
            ]}>
              Details:
            </Text>
            <ScrollView 
              style={styles.detailsScroll}
              horizontal={false}
            >
              <Text style={[
                styles.detailsText,
                isDark ? styles.textDark : styles.textLight
              ]}>
                {JSON.stringify(result.details, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      isDark ? styles.containerDark : styles.containerLight
    ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121212' : '#f5f5f5'}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          isDark ? styles.textDark : styles.textLight
        ]}>
          Semester Test Runner
        </Text>
        {results.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearResults}
          >
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Introduction */}
      <View style={styles.introSection}>
        <Text style={[
          styles.introText,
          isDark ? styles.textDark : styles.textLight
        ]}>
          This utility helps diagnose issues with semester-related functionality. 
          Select a test to run individually or run all tests to perform a comprehensive check.
        </Text>
      </View>
      
      {/* Test Buttons */}
      <View style={styles.buttonsContainer}>
        {renderTestButton('Authentication Test', 'authentication', 'key-outline', 
          status === 'running' && (currentTest === 'authentication' || currentTest === 'all'))}
        
        {renderTestButton('Data Validation Test', 'dataValidation', 'shield-checkmark-outline', 
          status === 'running' && (currentTest === 'dataValidation' || currentTest === 'all'))}
        
        {renderTestButton('Create Semester Test', 'createSemester', 'add-circle-outline', 
          status === 'running' && (currentTest === 'createSemester' || currentTest === 'all'))}
        
        {renderTestButton('Active Semester Test', 'activeSemester', 'star-outline', 
          status === 'running' && (currentTest === 'activeSemester' || currentTest === 'all'))}
        
        {renderTestButton('Date Format Test', 'dateFormat', 'calendar-outline', 
          status === 'running' && (currentTest === 'dateFormat' || currentTest === 'all'))}
        
        {renderTestButton('Supabase Connection Test', 'supabaseConnection', 'server-outline', 
          status === 'running' && (currentTest === 'supabaseConnection' || currentTest === 'all'))}
        
        {renderTestButton('Delete Semester Test', 'deleteSemester', 'trash-outline', 
          status === 'running' && (currentTest === 'deleteSemester' || currentTest === 'all'))}
      </View>
      
      {/* Run All Tests Button */}
      <TouchableOpacity
        style={[
          styles.runAllButton,
          isDark ? styles.runAllButtonDark : styles.runAllButtonLight,
          status === 'running' && styles.disabledButton
        ]}
        onPress={() => runTest('all')}
        disabled={status === 'running'}
      >
        {status === 'running' && currentTest === 'all' ? (
          <View style={styles.runningAllContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.runAllButtonText}>Running All Tests...</Text>
          </View>
        ) : (
          <>
            <Ionicons name="play-circle-outline" size={24} color="#fff" />
            <Text style={styles.runAllButtonText}>Run All Tests</Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Results Section */}
      <View style={styles.resultsContainer}>
        {results.length > 0 ? (
          <>
            <Text style={[
              styles.resultsTitle,
              isDark ? styles.textDark : styles.textLight
            ]}>
              Test Results:
            </Text>
            <ScrollView style={styles.resultsScroll}>
              {results.map((result, index) => renderTestResult(result, index))}
            </ScrollView>
          </>
        ) : status === 'idle' ? (
          <View style={styles.noResultsContainer}>
            <Ionicons 
              name="flask-outline" 
              size={48} 
              color={isDark ? '#555' : '#ccc'} 
            />
            <Text style={[
              styles.noResultsText,
              isDark ? styles.textDarkMuted : styles.textLightMuted
            ]}>
              Run a test to see results
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  containerLight: {
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF7F50',
    fontWeight: '500',
  },
  introSection: {
    marginBottom: 20,
  },
  introText: {
    fontSize: 16,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  testButtonLight: {
    backgroundColor: '#fff',
  },
  testButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  runAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  runAllButtonLight: {
    backgroundColor: '#4CAF50',
  },
  runAllButtonDark: {
    backgroundColor: '#388E3C',
  },
  runAllButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  runningAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultsScroll: {
    flex: 1,
  },
  resultCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  resultCardLight: {
    backgroundColor: '#fff',
  },
  resultCardDark: {
    backgroundColor: '#2a2a2a',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  passedText: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4CAF50',
  },
  failedText: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#F44336',
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 8,
    borderRadius: 6,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsScroll: {
    maxHeight: 120,
  },
  detailsText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  textLight: {
    color: '#333',
  },
  textDark: {
    color: '#fff',
  },
  textLightMuted: {
    color: '#999',
  },
  textDarkMuted: {
    color: '#777',
  }});
