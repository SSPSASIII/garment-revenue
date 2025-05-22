/**
 * @fileOverview Centralized API Error Handling.
 * Provides a class to handle various types of API errors consistently.
 */

// import { isCancel } from 'axios'; // Example: If you were using axios

export class APIErrorHandler {
    /**
     * Handles various API-related errors and returns a user-friendly message.
     *
     * @param error The error object caught.
     * @returns A string containing a user-friendly error message.
     */
    static handleApiError(error: unknown): string {
        // It's good practice to log the actual error for debugging,
        // even if you return a generic message to the user/flow.
        // console.error("API Error Encountered internally:", error);

        if (typeof error === 'string') {
            return error; // If it's already a string message (e.g., from Genkit flow itself)
        }

        if (error instanceof Error) {
            // Check for Genkit specific error patterns if any, or common HTTP error patterns
            // For example, if Genkit wraps HTTP errors and includes status codes in messages.

            const errorMessage = error.message.toLowerCase();

            // Axios cancellation check (if you were to use axios, otherwise remove or adapt)
            // if (isCancel(error)) { // isCancel is from axios
            //     return 'Request canceled by client.';
            // }

            // Generic network error patterns
            if (errorMessage.includes('network error') || errorMessage.includes('failed to fetch') || errorMessage.includes('dns lookup failed')) {
                return 'Network error. Please check your internet connection and API endpoint. Ensure firewalls or proxies are not blocking requests.';
            }

            // Timeout error (common pattern)
            if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
                 return "API request timed out. The server might be slow or overloaded. Please try again later.";
            }

            // Rate limit error (common patterns from various APIs)
            if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
                return "Rate limit exceeded for an external API. Please wait before making more requests or check your API plan limits.";
            }

            // Authentication/Authorization error (common patterns)
            if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('api key not valid') || errorMessage.includes('authentication failed')) {
                return "Authentication failed with an external API. Please check your API credentials (API key, token) or contact support if the issue persists.";
            }

            // Forbidden error
             if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
                return "Access to the requested API resource is forbidden. Check permissions or API key scope.";
            }

            // Not Found error
             if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                return "The requested API endpoint or resource was not found. Please check the URL.";
            }

            // Service unavailable error (common pattern)
            if (errorMessage.includes('503') || errorMessage.includes('service unavailable') || errorMessage.includes('server error')) {
                 return "An external API service is temporarily unavailable or experiencing issues. Please try again later.";
            }

            // For Genkit, if the error message already contains "Prediction failed:" from the flow, don't prepend it again.
            if (errorMessage.startsWith('prediction failed:')) {
                return error.message; // Return the original detailed message from the flow
            }

            // Return the specific error message if none of the above match well
            return `An error occurred: ${error.message}`;
        }

        // Fallback for unknown error types
        try {
            return `An unexpected error occurred: ${JSON.stringify(error)}`;
        } catch {
            return 'An unexpected and unstringifiable error occurred. Please check server logs.';
        }
    }
}
