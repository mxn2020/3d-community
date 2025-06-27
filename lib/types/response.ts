// lib/types/response.ts

// Actions
import { z } from 'zod';

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionError = {
  success: false;
  error: string | z.ZodIssue[];
  validationError?: boolean;
};

export type ActionResponse<T> = ActionSuccess<T> | ActionError;

// Mutations

// Type-safe function to check if a result is successful
export function isSuccessResult<T>(
  result: ActionResponse<T>
): result is ActionSuccess<T> {
  return result.success === true;
}

// Type-safe function to check if a result is an error
export function isErrorResult<T>(
  result: ActionResponse<T>
): result is ActionError {
  return result.success === false;
}

// Helper function to create a success response
export function successResult<T>(data: T): ActionSuccess<T> {
  return {
    success: true,
    data,
  };
}

// Helper function to create an error response
export function errorResult(error: string | z.ZodIssue[], validationError = false): ActionError {
  return {
    success: false,
    error,
    validationError,
  };
}