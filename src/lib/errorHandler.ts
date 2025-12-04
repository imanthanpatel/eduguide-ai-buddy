// Utility functions for consistent error handling across the application

/**
 * Formats and logs Supabase errors consistently
 */
export const handleSupabaseError = (error: any, operation: string, showToast?: any) => {
  console.error(`[${operation}] Supabase error:`, error);
  
  let errorMessage = 'An unknown error occurred';
  
  if (error.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Log additional details if available
  if (error.details) {
    console.error(`[${operation}] Error details:`, error.details);
  }
  
  if (error.hint) {
    console.error(`[${operation}] Error hint:`, error.hint);
  }
  
  // Show toast notification if provided
  if (showToast) {
    showToast({
      title: "Error",
      description: `[${operation}] ${errorMessage}`,
      variant: "destructive",
    });
  }
  
  return errorMessage;
};

/**
 * Checks if the user is authenticated before performing operations
 */
export const ensureAuthenticated = async (supabaseClient: any) => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    throw new Error('User is not authenticated. Please log in and try again.');
  }
  
  return session;
};

/**
 * Wraps Supabase operations with consistent error handling
 */
export const withErrorHandling = async <T>(
  operation: string,
  operationFn: () => Promise<T>,
  showToast?: any
): Promise<{ data?: T; error?: string }> => {
  try {
    const data = await operationFn();
    return { data };
  } catch (error: any) {
    const errorMessage = handleSupabaseError(error, operation, showToast);
    return { error: errorMessage };
  }
};

/**
 * Validates that required fields are present
 */
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return true;
};

/**
 * Retries a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};