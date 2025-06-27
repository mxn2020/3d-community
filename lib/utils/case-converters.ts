// apps/prompt-verse/lib/utils/case-converters.ts

import { Database } from "../types/database.types";

/**
 * Converts a string from camelCase to snake_case
 * Example: "myVariableName" -> "my_variable_name"
 */
export function toSnakeCaseString(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Converts a string from snake_case to camelCase
 * Example: "my_variable_name" -> "myVariableName"
 */
export function toCamelCaseString(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}
/**
 * Converts an object from camelCase to snake_case
 * Example: { myVariableName: 'value' } -> { my_variable_name: 'value' }
 */
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

/**
 * Converts an object from snake_case to camelCase
 * Example: { my_variable_name: 'value' } -> { myVariableName: 'value' }
 */
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

// Type to convert snake_case string to camelCase
export type CamelCase<S extends string> =
  S extends `${infer P}_${infer Q}`
  ? `${P}${Capitalize<CamelCase<Q>>}`
  : S;

// Type to recursively transform object keys from snake_case to camelCase
export type CamelCaseKeys<T> = T extends Array<infer U>
  ? Array<CamelCaseKeys<U>>
  : T extends object
  ? {
    [K in keyof T as CamelCase<string & K>]: CamelCaseKeys<T[K]>
  }
  : T;

// Apply this transformation to your Supabase types
export type CamelCasedDB = CamelCaseKeys<Database>;