/**
 * @fileOverview Centralized API Error Handling.
 * Provides a class to handle various types of API errors consistently.
 */

import { isCancel } from 'axios'; // Example: Assuming axios might be used later

export class APIErrorHandler {
    /**
     * Handles various API-related errors and returns a user-friendly message.
     *
     * @param error The error object caught.
     * @returns A string containing a user-friendly error message.
     */
    static handleApiError(error: unknown): string {
        console.error("API Error Encountered:", error);

        // Check for specific error types (customize based on libraries used)
        if (typeof error === 'string') {
            return error; // If it's already a string message
        }

        if (error instanceof Error) {
            // Axios cancellation check (example)
            if (isCancel(error)) {
                return 'Request canceled.';
            }

            // Generic network error
            if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
                return 'Network error. Please check your connection and try again.';
            }

            // Timeout error (might depend on library)
            if (error.message.toLowerCase().includes('timeout')) {
                 return "API request timed out. Please try again later.";
            }

             // Rate limit error (common pattern)
            if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
                return "Rate limit exceeded. Please wait before making more requests.";
            }

            // Authentication error (common pattern)
            if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
                return "Authentication failed. Please check API credentials or contact support.";
            }

            // Service unavailable error (common pattern)
            if (error.message.includes('503') || error.message.toLowerCase().includes('service unavailable')) {
                 return "Service temporarily unavailable. Please try again later.";
            }

            // Return the specific error message if none of the above match
            return `An error occurred: ${error.message}`;
        }

        // Fallback for unknown error types
        return 'An unexpected error occurred. Please try again.';
    }
}
