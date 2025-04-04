import { USE_MOCK_DATA } from '@/config';

/**
 * A composable to help handle fetching data from the correct source (real API or fallback mock data)
 * based on the application configuration.
 * 
 * @param {Function} apiFn - The real API function to call
 * @param {Function} mockFn - The mock data function to use as fallback (optional)
 * @returns {Function} A function that returns a Promise resolving to the data
 */
export function useDataSource(apiFn, mockFn = null) {
  
  return async (...args) => {
    // Always attempt to use the real API first unless mocks are explicitly enabled
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiFn(...args);
        return response.data;
      } catch (error) {
        console.error('API call failed:', error);
        
        // If there's no mock fallback function, rethrow the error
        if (!mockFn) {
          throw error;
        }
        
        // Log that we're falling back to mock data
        console.warn('Falling back to mock data due to API error');
      }
    } else if (mockFn) {
      console.warn('Using mock data as specified in config');
    }
    
    // Use mock data if explicitly enabled or as fallback
    if (mockFn) {
      try {
        return await mockFn(...args);
      } catch (mockError) {
        console.error('Mock data generation failed:', mockError);
        throw mockError;
      }
    } else {
      throw new Error('No data source available: API failed and no mock fallback provided');
    }
  };
}

export default useDataSource; 