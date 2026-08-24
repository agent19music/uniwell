/**
 * Toast Module Test Suite
 * 
 * Tests the unified toast implementation to ensure it works correctly
 * across web and native platforms without ReactCurrentDispatcher errors.
 */

// Set up mocks before any imports
const mockPlatform = { OS: 'web' };
jest.mock('react-native', () => ({
  Platform: mockPlatform,
}));

// Mock react-hot-toast for web platform
jest.mock('react-hot-toast', () => {
  const mockToast = Object.assign(
    jest.fn(), // Make it callable as a function
    {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(() => 'toast-id'),
      dismiss: jest.fn(),
      promise: jest.fn((promise) => promise),
      custom: jest.fn(),
    }
  );
  return {
    default: mockToast,
    __esModule: true,
  };
});

// Mock burnt for native platforms
jest.mock('burnt', () => ({
  toast: jest.fn(),
  alert: jest.fn(),
}));

describe('Toast Module', () => {
  let toast: any;
  
  beforeEach(() => {
    // Clear module cache to allow re-importing with different Platform.OS
    jest.resetModules();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'web';
      jest.resetModules();
      toast = require('../lib/toast/index').default;
    });

    it('should call react-hot-toast for success toast on web', () => {
      const hotToast = require('react-hot-toast').default;
      toast.success('Success message');
      
      expect(hotToast.success).toHaveBeenCalledWith(
        'Success message',
        expect.objectContaining({
          duration: 4000,
          position: 'bottom-center',
        })
      );
    });

    it('should call react-hot-toast for error toast on web', () => {
      const hotToast = require('react-hot-toast').default;
      toast.error('Error message');
      
      expect(hotToast.error).toHaveBeenCalledWith(
        'Error message',
        expect.objectContaining({
          duration: 4000,
          position: 'bottom-center',
        })
      );
    });

    it('should handle loading toast on web', () => {
      const hotToast = require('react-hot-toast').default;
      const toastId = toast.loading('Loading...');
      
      expect(hotToast.loading).toHaveBeenCalledWith(
        'Loading...',
        expect.objectContaining({
          duration: Infinity,
          position: 'bottom-center',
        })
      );
      expect(toastId).toBe('toast-id');
    });

    it('should dismiss toast on web', () => {
      const hotToast = require('react-hot-toast').default;
      toast.dismiss('toast-id');
      
      expect(hotToast.dismiss).toHaveBeenCalledWith('toast-id');
    });

    it('should handle promise toast on web', async () => {
      const hotToast = require('react-hot-toast').default;
      const mockPromise = Promise.resolve('Success data');
      
      await toast.promise(
        mockPromise,
        {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        }
      );
      
      expect(hotToast.promise).toHaveBeenCalledWith(
        mockPromise,
        expect.objectContaining({
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        }),
        expect.objectContaining({
          duration: 4000,
          position: 'bottom-center',
        })
      );
    });
  });

  describe('iOS Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'ios';
      jest.resetModules();
      toast = require('../lib/toast/index').default;
    });

    it('should call burnt.toast for success toast on iOS', () => {
      const burnt = require('burnt');
      toast.success('Success message');
      
      expect(burnt.toast).toHaveBeenCalledWith({
        title: 'Success message',
        preset: 'done',
        haptic: 'success',
        layout: undefined,
      });
    });

    it('should call burnt.toast for error toast on iOS', () => {
      const burnt = require('burnt');
      toast.error('Error message');
      
      expect(burnt.toast).toHaveBeenCalledWith({
        title: 'Error message',
        preset: 'error',
        haptic: 'error',
        layout: undefined,
      });
    });

    it('should handle basic toast on iOS', () => {
      const burnt = require('burnt');
      toast('Basic message');
      
      expect(burnt.toast).toHaveBeenCalledWith({
        title: 'Basic message',
        preset: 'none',
        haptic: 'none',
        layout: undefined,
      });
    });

    it('should handle custom toast options on iOS', () => {
      const burnt = require('burnt');
      toast({
        title: 'Custom Title',
        message: 'Custom Message',
        preset: 'heart',
        haptic: 'success',
      });
      
      expect(burnt.toast).toHaveBeenCalledWith({
        title: 'Custom Title',
        message: 'Custom Message',
        preset: 'heart',
        haptic: 'success',
        layout: undefined,
      });
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'android';
      jest.resetModules();
      toast = require('../lib/toast/index').default;
    });

    it('should call burnt.toast for success toast on Android', () => {
      const burnt = require('burnt');
      toast.success('Success message');
      
      expect(burnt.toast).toHaveBeenCalledWith({
        title: 'Success message',
        preset: 'done',
        haptic: 'success',
        layout: undefined,
      });
    });

    it('should call burnt.toast for error toast on Android', () => {
      const burnt = require('burnt');
      toast.error('Error message');
      
      expect(burnt.toast).toHaveBeenCalledWith({
        title: 'Error message',
        preset: 'error',
        haptic: 'error',
        layout: undefined,
      });
    });

    it('should handle promise toast on Android', async () => {
      const burnt = require('burnt');
      const mockPromise = Promise.resolve('Success data');
      
      await toast.promise(
        mockPromise,
        {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        }
      );
      
      // Should show loading toast first
      expect(burnt.toast).toHaveBeenNthCalledWith(1, {
        title: 'Loading...',
        preset: 'none',
        haptic: 'none',
      });
      
      // Then show success toast
      expect(burnt.toast).toHaveBeenNthCalledWith(2, {
        title: 'Success!',
        preset: 'done',
        haptic: 'success',
      });
    });

    it('should handle promise rejection on Android', async () => {
      const burnt = require('burnt');
      const mockPromise = Promise.reject(new Error('Test error'));
      
      try {
        await toast.promise(
          mockPromise,
          {
            loading: 'Loading...',
            success: 'Success!',
            error: (err) => `Error: ${err.message}`,
          }
        );
      } catch (error) {
        // Expected to throw
      }
      
      // Should show loading toast first
      expect(burnt.toast).toHaveBeenNthCalledWith(1, {
        title: 'Loading...',
        preset: 'none',
        haptic: 'none',
      });
      
      // Then show error toast
      expect(burnt.toast).toHaveBeenNthCalledWith(2, {
        title: 'Error: Test error',
        preset: 'error',
        haptic: 'error',
      });
    });
  });

  describe('Platform Detection', () => {
    it('should correctly detect web platform', () => {
      mockPlatform.OS = 'web';
      jest.resetModules();
      
      const { isWeb } = require('../lib/toast/index');
      expect(isWeb).toBe(true);
    });

    it('should correctly detect native platforms', () => {
      ['ios', 'android'].forEach(platform => {
        mockPlatform.OS = platform;
        jest.resetModules();
        
        const { isWeb } = require('../lib/toast/index');
        expect(isWeb).toBe(false);
      });
    });
  });

  describe('No ReactCurrentDispatcher Error', () => {
    it('should not import burnt on web platform', () => {
      mockPlatform.OS = 'web';
      jest.resetModules();
      
      // This test ensures that burnt is never required on web
      // which would cause the ReactCurrentDispatcher error
      const burnt = require('burnt');
      const toast = require('../lib/toast/index').default;
      toast('Test message');
      
      // burnt.toast should NOT be called on web
      expect(burnt.toast).not.toHaveBeenCalled();
    });
  });
});
