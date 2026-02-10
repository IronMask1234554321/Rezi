/**
 * packages/core/src/forms/useForm.ts — Form management hook.
 *
 * Why: Provides a React-like form management hook for Rezi widgets.
 * Manages form values, validation, touched/dirty state, and submission.
 * Works with the widget composition API via WidgetContext hooks.
 *
 * @see docs/recipes/form-validation.md (GitHub issue #119)
 */

import type { WidgetContext } from "../widgets/composition.js";
import type { FormState, UseFormOptions, UseFormReturn } from "./types.js";
import {
  DEFAULT_ASYNC_DEBOUNCE_MS,
  createDebouncedAsyncValidator,
  isValidationClean,
  mergeValidationErrors,
  runAsyncValidation,
  runFieldValidation,
  runSyncValidation,
} from "./validation.js";

/**
 * Create initial form state from options.
 */
function createInitialState<T extends Record<string, unknown>>(
  options: UseFormOptions<T>,
): FormState<T> {
  return {
    values: { ...options.initialValues },
    errors: {},
    touched: {},
    dirty: {},
    isSubmitting: false,
    submitCount: 0,
  };
}

/**
 * Compute dirty status for a field by comparing current value to initial.
 */
function computeFieldDirty<T extends Record<string, unknown>>(
  field: keyof T,
  currentValue: T[keyof T],
  initialValues: T,
): boolean {
  return !Object.is(currentValue, initialValues[field]);
}

/**
 * Compute overall dirty status from dirty map.
 */
function computeIsDirty<T extends Record<string, unknown>>(
  dirty: Partial<Record<keyof T, boolean>>,
): boolean {
  const keys = Object.keys(dirty) as (keyof T)[];
  for (const key of keys) {
    if (dirty[key] === true) {
      return true;
    }
  }
  return false;
}

/**
 * Form management hook for Rezi widgets.
 *
 * Provides comprehensive form state management including:
 * - Field value tracking
 * - Touched/dirty state
 * - Sync and async validation
 * - Form submission handling
 *
 * @param ctx - Widget context from defineWidget render function
 * @param options - Form configuration options
 * @returns Form state and control methods
 *
 * @example
 * ```ts
 * const LoginForm = defineWidget<{ onLogin: (u: string, p: string) => void }>(
 *   (props, ctx) => {
 *     const form = useForm(ctx, {
 *       initialValues: { username: "", password: "" },
 *       validate: (v) => {
 *         const errors: Record<string, string> = {};
 *         if (!v.username) errors.username = "Required";
 *         if (v.password.length < 8) errors.password = "Min 8 chars";
 *         return errors;
 *       },
 *       onSubmit: (v) => props.onLogin(v.username, v.password),
 *     });
 *
 *     return ui.column([
 *       ui.input({
 *         id: ctx.id("username"),
 *         value: form.values.username,
 *         onInput: form.handleChange("username"),
 *         onBlur: form.handleBlur("username"),
 *       }),
 *       // ...
 *     ]);
 *   }
 * );
 * ```
 */
export function useForm<T extends Record<string, unknown>, State = void>(
  ctx: WidgetContext<State>,
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  // Store form state using widget's useState hook
  const [state, setState] = ctx.useState<FormState<T>>(() => createInitialState(options));

  // Store initial values in a ref for dirty comparison
  const initialValuesRef = ctx.useRef<T>({ ...options.initialValues });

  // Store async validator reference
  const asyncValidatorRef = ctx.useRef<
    ReturnType<typeof createDebouncedAsyncValidator<T>> | undefined
  >(undefined);

  // Ref to safely pass values from setState callback to async validation
  const pendingAsyncValuesRef = ctx.useRef<T | null>(null);

  // Initialize or update async validator when options change
  ctx.useEffect(() => {
    if (options.validateAsync) {
      asyncValidatorRef.current = createDebouncedAsyncValidator(
        options.validateAsync,
        options.validateAsyncDebounce ?? DEFAULT_ASYNC_DEBOUNCE_MS,
        (asyncErrors) => {
          setState((prev) => ({
            ...prev,
            errors: mergeValidationErrors(
              runSyncValidation(prev.values, options.validate),
              asyncErrors,
            ),
          }));
        },
      );

      return () => {
        asyncValidatorRef.current?.cancel();
      };
    }
    return undefined;
  }, [options.validateAsync, options.validateAsyncDebounce]);

  // Compute derived state
  const isValid = isValidationClean(state.errors);
  const isDirty = computeIsDirty(state.dirty);

  /**
   * Validate form and update errors.
   */
  const validateForm = (): Partial<Record<keyof T, string>> => {
    const errors = runSyncValidation(state.values, options.validate);
    setState((prev) => ({
      ...prev,
      errors,
    }));
    return errors;
  };

  /**
   * Validate a single field.
   */
  const validateField = (field: keyof T): string | undefined => {
    const error = runFieldValidation(state.values, field, options.validate);
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
    return error;
  };

  /**
   * Set a specific field's value.
   */
  const setFieldValue = (field: keyof T, value: T[keyof T]): void => {
    const newDirty = computeFieldDirty(field, value, initialValuesRef.current);

    setState((prev) => {
      const newValues = { ...prev.values, [field]: value };
      // Store in ref for async validation (safe handoff from callback)
      pendingAsyncValuesRef.current = newValues;
      let newErrors = prev.errors;

      // Run validation on change if enabled
      if (options.validateOnChange) {
        newErrors = runSyncValidation(newValues, options.validate);
      }

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        dirty: {
          ...prev.dirty,
          [field]: newDirty,
        },
      };
    });

    // Trigger async validation if configured
    const asyncValues = pendingAsyncValuesRef.current;
    pendingAsyncValuesRef.current = null; // Clear to avoid stale data
    if (options.validateOnChange && asyncValidatorRef.current && asyncValues) {
      asyncValidatorRef.current.run(asyncValues);
    }
  };

  /**
   * Set a specific field's error.
   */
  const setFieldError = (field: keyof T, error: string | undefined): void => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  };

  /**
   * Mark a field as touched.
   */
  const setFieldTouched = (field: keyof T, touched: boolean): void => {
    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: touched,
      },
    }));
  };

  /**
   * Handle change for a specific field.
   */
  const handleChange =
    (field: keyof T) =>
    (value: T[keyof T]): void => {
      setFieldValue(field, value);
    };

  /**
   * Handle blur for a specific field.
   */
  const handleBlur = (field: keyof T) => (): void => {
    setFieldTouched(field, true);

    // Run validation on blur if enabled (default: true)
    const validateOnBlur = options.validateOnBlur ?? true;
    if (validateOnBlur) {
      const errors = runSyncValidation(state.values, options.validate);
      setState((prev) => ({
        ...prev,
        touched: {
          ...prev.touched,
          [field]: true,
        },
        errors,
      }));

      // Trigger async validation
      if (asyncValidatorRef.current) {
        asyncValidatorRef.current.run(state.values);
      }
    }
  };

  /**
   * Reset form to initial state.
   */
  const reset = (): void => {
    asyncValidatorRef.current?.cancel();
    setState(createInitialState(options));
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = (): void => {
    // Don't submit if already submitting
    if (state.isSubmitting) {
      return;
    }

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    const keys = Object.keys(state.values) as (keyof T)[];
    for (const key of keys) {
      allTouched[key] = true;
    }

    // Run sync validation
    const syncErrors = runSyncValidation(state.values, options.validate);

    // Update state with touched and sync errors
    setState((prev) => ({
      ...prev,
      touched: allTouched,
      errors: syncErrors,
      submitCount: prev.submitCount + 1,
    }));

    // If sync validation fails, don't submit
    if (!isValidationClean(syncErrors)) {
      return;
    }

    // Set submitting state
    setState((prev) => ({
      ...prev,
      isSubmitting: true,
    }));

    // Run async validation and submit
    const submitAsync = async (): Promise<void> => {
      try {
        const asyncErrors = await runAsyncValidation(state.values, options.validateAsync);

        const allErrors = mergeValidationErrors(syncErrors, asyncErrors);

        if (!isValidationClean(allErrors)) {
          // Async validation failed
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            errors: allErrors,
          }));
          return;
        }

        // Call onSubmit
        await Promise.resolve(options.onSubmit(state.values));

        // Reset if configured
        if (options.resetOnSubmit) {
          reset();
        } else {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
          }));
        }
      } catch {
        // Submission error - stop submitting
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
        }));
      }
    };

    // Execute async submission
    void submitAsync();
  };

  return Object.freeze({
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    dirty: state.dirty,
    isValid,
    isDirty,
    isSubmitting: state.isSubmitting,
    submitCount: state.submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
  });
}
