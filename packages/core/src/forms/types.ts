/**
 * packages/core/src/forms/types.ts — Form management type definitions.
 *
 * Why: Defines types for the form system including useForm options and return
 * types, field state tracking, validation configuration, and error handling.
 *
 * @see docs/recipes/form-validation.md (GitHub issue #119)
 */

/**
 * Options for configuring the useForm hook.
 */
export type UseFormOptions<T extends Record<string, unknown>> = Readonly<{
  /** Initial values for all form fields. */
  initialValues: T;

  /** Synchronous validation function. Returns errors for invalid fields. */
  validate?: (values: T) => Partial<Record<keyof T, string>>;

  /** Whether to run validation on every value change. Default: false. */
  validateOnChange?: boolean;

  /** Whether to run validation when a field loses focus. Default: true. */
  validateOnBlur?: boolean;

  /** Callback invoked when form is submitted with valid values. */
  onSubmit: (values: T) => void | Promise<void>;

  /** Whether to reset form to initial values after successful submit. Default: false. */
  resetOnSubmit?: boolean;

  /** Asynchronous validation function (e.g., server-side checks). */
  validateAsync?: (values: T) => Promise<Partial<Record<keyof T, string>>>;

  /** Debounce delay in ms for async validation. Default: 300. */
  validateAsyncDebounce?: number;
}>;

/**
 * Return type of the useForm hook.
 */
export type UseFormReturn<T extends Record<string, unknown>> = Readonly<{
  /** Current form field values. */
  values: T;

  /** Validation errors keyed by field name. */
  errors: Partial<Record<keyof T, string>>;

  /** Fields that have been focused and then blurred. */
  touched: Partial<Record<keyof T, boolean>>;

  /** Fields that have been modified from initial values. */
  dirty: Partial<Record<keyof T, boolean>>;

  /** True if the form has no validation errors. */
  isValid: boolean;

  /** True if any field has been modified from initial values. */
  isDirty: boolean;

  /** True if form submission is in progress. */
  isSubmitting: boolean;

  /** Number of times handleSubmit has been called. */
  submitCount: number;

  /**
   * Returns a change handler for a specific field.
   * Use with input onInput callbacks.
   */
  handleChange: (field: keyof T) => (value: T[keyof T]) => void;

  /**
   * Returns a blur handler for a specific field.
   * Marks field as touched and may trigger validation.
   */
  handleBlur: (field: keyof T) => () => void;

  /**
   * Submits the form if validation passes.
   * Runs both sync and async validation before calling onSubmit.
   */
  handleSubmit: () => void;

  /** Resets form to initial values and clears all state. */
  reset: () => void;

  /** Sets a specific field's value programmatically. */
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;

  /** Sets a specific field's error programmatically. */
  setFieldError: (field: keyof T, error: string | undefined) => void;

  /** Marks a specific field as touched or untouched. */
  setFieldTouched: (field: keyof T, touched: boolean) => void;

  /** Validates a single field and returns its error (if any). */
  validateField: (field: keyof T) => string | undefined;

  /** Validates all fields and returns errors object. */
  validateForm: () => Partial<Record<keyof T, string>>;
}>;

/**
 * Internal form state managed by useForm.
 */
export type FormState<T extends Record<string, unknown>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  submitCount: number;
};

/**
 * Validation result from sync or async validators.
 */
export type ValidationResult<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

/**
 * Context passed to validation functions.
 */
export type ValidationContext<T extends Record<string, unknown>> = Readonly<{
  values: T;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
}>;
