import { PartitionResult, Result, ResultHandler } from "./result";

/**
 * Creates a successful {@link Result}.
 *
 * @typeParam T - The success value type.
 * @param value - The successful value to wrap.
 * @returns A result in the `{ ok: true, value }` form.
 *
 * @example
 * ```ts
 * const result = Ok(42);
 * // { ok: true, value: 42 }
 * ```
 */
export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

/**
 * Creates a failed {@link Result}.
 *
 * @typeParam E - The error type.
 * @param error - The error value to wrap.
 * @returns A result in the `{ ok: false, error }` form.
 *
 * @example
 * ```ts
 * const result = Err("Something went wrong");
 * // { ok: false, error: "Something went wrong" }
 * ```
 */
export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

/**
 * Maps the success value of a {@link Result}, leaving errors unchanged.
 *
 * This is useful when you want to transform a successful result
 * without touching the error branch.
 *
 * @typeParam T - The input success type.
 * @typeParam E - The error type.
 * @typeParam U - The output success type.
 * @param result - The result to transform.
 * @param fn - Function applied only when the result is successful.
 * @returns A new result with the mapped success value, or the original error.
 *
 * @example
 * ```ts
 * const result = map(Ok(2), n => n * 3);
 * // Ok(6)
 * ```
 *
 * @example
 * ```ts
 * const result = map(Err("invalid"), n => n * 3);
 * // Err("invalid")
 * ```
 */
export function map<T, E, U>(
  result: Result<T, E>,
  fn: (_value: T) => U,
): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

/**
 * Maps the error value of a {@link Result}, leaving success values unchanged.
 *
 * This is useful for converting low-level errors into domain-specific errors.
 *
 * @typeParam T - The success type.
 * @typeParam E - The input error type.
 * @typeParam F - The output error type.
 * @param result - The result to transform.
 * @param fn - Function applied only when the result is a failure.
 * @returns A new result with the mapped error, or the original success value.
 *
 * @example
 * ```ts
 * const result = mapErr(Err("not_found"), e => `API error: ${e}`);
 * // Err("API error: not_found")
 * ```
 *
 * @example
 * ```ts
 * const result = mapErr(Ok(10), e => `API error: ${e}`);
 * // Ok(10)
 * ```
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (_error: E) => F,
): Result<T, F> {
  return result.ok ? result : Err(fn(result.error));
}

/**
 * Maps both branches of a {@link Result}.
 *
 * Use this when you want to transform either the success value or the error
 * in a single expression.
 *
 * @typeParam T - The input success type.
 * @typeParam E - The input error type.
 * @typeParam U - The output success type.
 * @typeParam F - The output error type.
 * @param result - The result to transform.
 * @param mapOk - Function applied to the success value.
 * @param mapErr - Function applied to the error value.
 * @returns A new result with either the mapped success or mapped error.
 *
 * @example
 * ```ts
 * const a = bimap(Ok(2), n => n * 10, e => `Error: ${e}`);
 * // Ok(20)
 * ```
 *
 * @example
 * ```ts
 * const b = bimap(Err("missing"), n => n * 10, e => `Error: ${e}`);
 * // Err("Error: missing")
 * ```
 */
export function bimap<T, E, U, F>(
  result: Result<T, E>,
  mapOk: (_value: T) => U,
  mapErr: (_value: E) => F,
): Result<U, F> {
  return result.ok ? Ok(mapOk(result.value)) : Err(mapErr(result.error));
}

/**
 * Extracts the success value from a {@link Result}.
 *
 * Throws the contained error if the result is a failure.
 *
 * Prefer this only when failures are truly exceptional or already guaranteed
 * not to happen.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to unwrap.
 * @returns The success value.
 * @throws The contained error when the result is a failure.
 *
 * @example
 * ```ts
 * const value = unwrap(Ok("hello"));
 * // "hello"
 * ```
 *
 * @example
 * ```ts
 * const value = unwrap(Err(new Error("Boom")));
 * // throws Error("Boom")
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

/**
 * Extracts the success value from a {@link Result}, or returns a fallback value
 * if the result is a failure.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to unwrap.
 * @param fallback - The fallback value returned when the result is an error.
 * @returns The success value or the fallback.
 *
 * @example
 * ```ts
 * const value = unwrapOr(Ok(5), 0);
 * // 5
 * ```
 *
 * @example
 * ```ts
 * const value = unwrapOr(Err("invalid"), 0);
 * // 0
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/**
 * Extracts the success value from a {@link Result}, or computes a fallback
 * from the error value.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to unwrap.
 * @param fn - Function used to compute a fallback from the error.
 * @returns The success value or the computed fallback.
 *
 * @example
 * ```ts
 * const value = unwrapOrElse(Ok(10), error => 0);
 * // 10
 * ```
 *
 * @example
 * ```ts
 * const value = unwrapOrElse(Err("missing"), error => error.length);
 * // 7
 * ```
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (_error: E) => T,
): T {
  return result.ok ? result.value : fn(result.error);
}

/**
 * Chains another result-producing function onto a successful {@link Result}.
 *
 * This is commonly known as `flatMap` in other APIs.
 *
 * If the input result is an error, it is returned unchanged.
 *
 * @typeParam T - The input success type.
 * @typeParam E - The error type.
 * @typeParam U - The output success type.
 * @param result - The result to chain.
 * @param fn - Function returning the next result when the input is successful.
 * @returns The next result, or the original error.
 *
 * @example
 * ```ts
 * const parsePositive = (n: number): Result<number, string> =>
 *   n > 0 ? Ok(n) : Err("must be positive");
 *
 * const result = andThen(Ok(5), parsePositive);
 * // Ok(5)
 * ```
 *
 * @example
 * ```ts
 * const parsePositive = (n: number): Result<number, string> =>
 *   n > 0 ? Ok(n) : Err("must be positive");
 *
 * const result = andThen(Ok(-1), parsePositive);
 * // Err("must be positive")
 * ```
 */
export function andThen<T, E, U>(
  result: Result<T, E>,
  fn: (_value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Recovers from an error by providing an alternative {@link Result}.
 *
 * If the input result is successful, it is returned unchanged.
 *
 * @typeParam T - The success type.
 * @typeParam E - The input error type.
 * @typeParam F - The recovery error type.
 * @param result - The result to recover from.
 * @param fn - Function used to produce a replacement result when an error occurs.
 * @returns The original success result or the recovery result.
 *
 * @example
 * ```ts
 * const result = orElse(Err("not found"), () => Ok("default user"));
 * // Ok("default user")
 * ```
 *
 * @example
 * ```ts
 * const result = orElse(Ok("alice"), () => Ok("default user"));
 * // Ok("alice")
 * ```
 */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (_error: E) => Result<T, F>,
): Result<T, F> {
  return result.ok ? result : fn(result.error);
}

/**
 * Extracts the success value from a {@link Result}, throwing a new
 * {@link Error} with a custom message if the result is a failure.
 *
 * Unlike {@link unwrap}, this always throws a standard `Error` object.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to unwrap.
 * @param message - Custom context message for the thrown error.
 * @returns The success value.
 * @throws {Error} If the result is a failure.
 *
 * @example
 * ```ts
 * const value = expect(Ok(123), "Expected a number");
 * // 123
 * ```
 *
 * @example
 * ```ts
 * const value = expect(Err("missing"), "Expected a user");
 * // throws Error("Expected a user: missing")
 * ```
 */
export function expect<T, E>(result: Result<T, E>, message: string): T | never {
  if (!result.ok) {
    throw new Error(`${message}: ${result.error}`);
  }
  return result.value;
}

/**
 * Validates a raw value with a predicate and turns it into a {@link Result}.
 *
 * Returns `Ok(value)` when the predicate passes, otherwise returns
 * `Err(onFalse(value))`.
 *
 * @typeParam T - The value type.
 * @typeParam E - The error type.
 * @param value - The value to validate.
 * @param predicate - Validation predicate.
 * @param onFalse - Function used to build an error if validation fails.
 * @returns A successful result if the predicate passes, otherwise an error result.
 *
 * @example
 * ```ts
 * const ageResult = ensure(20, n => n >= 18, n => `Minor: ${n}`);
 * // Ok(20)
 * ```
 *
 * @example
 * ```ts
 * const ageResult = ensure(16, n => n >= 18, n => `Minor: ${n}`);
 * // Err("Minor: 16")
 * ```
 */
export function ensure<T, E>(
  value: T,
  predicate: (_value: T) => boolean,
  onFalse: (_value: T) => E,
): Result<T, E> {
  return predicate(value) ? Ok(value) : Err(onFalse(value));
}

/**
 * Pattern-matches a {@link Result} using explicit handlers for both branches.
 *
 * This is a safe alternative to manual `if (result.ok)` branching.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @typeParam U - The output type produced by both handlers.
 * @param result - The result to match on.
 * @param handlers - Object containing handlers for success and error.
 * @returns The value returned by the matching handler.
 *
 * @example
 * ```ts
 * const message = match(Ok("Alice"), {
 *   ok: value => `Hello ${value}`,
 *   err: error => `Error: ${error}`,
 * });
 * // "Hello Alice"
 * ```
 *
 * @example
 * ```ts
 * const message = match(Err("not found"), {
 *   ok: value => `Hello ${value}`,
 *   err: error => `Error: ${error}`,
 * });
 * // "Error: not found"
 * ```
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: ResultHandler<T, E, U>,
): U {
  return result.ok ? handlers.ok(result.value) : handlers.err(result.error);
}

/**
 * Converts a throwing synchronous function into a {@link Result}.
 *
 * This is useful when integrating exception-based APIs into a result-based flow.
 *
 * @typeParam T - The success type.
 * @typeParam E - The mapped error type.
 * @param fn - Function that may throw.
 * @param mapError - Function used to convert unknown thrown values into your error type.
 * @returns `Ok` with the return value, or `Err` with the mapped error.
 *
 * @example
 * ```ts
 * const result = fromThrowable(
 *   () => JSON.parse('{"name":"Alice"}'),
 *   error => `Invalid JSON: ${String(error)}`
 * );
 * ```
 *
 * @example
 * ```ts
 * const result = fromThrowable(
 *   () => {
 *     throw new Error("Boom");
 *   },
 *   error => String(error)
 * );
 * // Err("Error: Boom")
 * ```
 */
export function fromThrowable<T, E = unknown>(
  fn: () => T,
  mapError: (_error: unknown) => E,
): Result<T, E> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(mapError(error));
  }
}

/**
 * Converts a nullable value into a {@link Result}.
 *
 * Returns an error when the input is `null` or `undefined`.
 *
 * @typeParam T - The non-null value type.
 * @typeParam E - The error type.
 * @param value - The nullable value to wrap.
 * @param onNull - Function used to build the error if the value is nullish.
 * @returns `Ok(value)` when non-null, otherwise `Err(onNull())`.
 *
 * @example
 * ```ts
 * const result = fromNullable(user.email, () => "Missing email");
 * ```
 *
 * @example
 * ```ts
 * const result = fromNullable(null, () => "Value is required");
 * // Err("Value is required")
 * ```
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  onNull: () => E,
): Result<T, E> {
  return value == null ? Err(onNull()) : Ok(value);
}

/**
 * Converts a {@link Result} into a standard promise.
 *
 * Successful results become resolved promises, while errors become rejected promises.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to convert.
 * @returns A promise that resolves with the success value or rejects with the error.
 *
 * @example
 * ```ts
 * const promise = toPromise(Ok(42));
 * // Promise.resolve(42)
 * ```
 *
 * @example
 * ```ts
 * const promise = toPromise(Err("failed"));
 * // Promise.reject("failed")
 * ```
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
  return result.ok
    ? Promise.resolve(result.value)
    : Promise.reject(result.error);
}

/**
 * Collects an array of results into a single result containing an array of values.
 *
 * Stops at the first error and returns it immediately.
 *
 * This is similar to `Promise.all`, but for synchronous results.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error type.
 * @param results - Array of results to combine.
 * @returns `Ok` with all success values, or the first encountered `Err`.
 *
 * @example
 * ```ts
 * const result = all([Ok(1), Ok(2), Ok(3)]);
 * // Ok([1, 2, 3])
 * ```
 *
 * @example
 * ```ts
 * const result = all([Ok(1), Err("bad"), Ok(3)]);
 * // Err("bad")
 * ```
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }

  return Ok(values);
}

/**
 * Splits an array of results into separate arrays of successful values and errors.
 *
 * Unlike {@link all}, this does not stop at the first error.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error type.
 * @param results - Array of results to partition.
 * @returns An object with `oks` and `errs` arrays.
 *
 * @example
 * ```ts
 * const result = partition([Ok(1), Err("bad"), Ok(3), Err("oops")]);
 * // { oks: [1, 3], errs: ["bad", "oops"] }
 * ```
 */
/* eslint-disable max-lines-per-function */
export function partition<T, E>(
  results: Result<T, E>[],
): PartitionResult<T, E> {
  const oks: T[] = [];
  const errs: E[] = [];

  for (const result of results) {
    if (result.ok) oks.push(result.value);
    else errs.push(result.error);
  }
  return { oks, errs };
}
/* eslint-enable max-lines-per-function */

/**
 * Runs a side-effect on the success value of a {@link Result},
 * then returns the original result unchanged.
 *
 * Useful for logging, tracing, or debugging success values in a pipeline.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to inspect.
 * @param fn - Side-effect function run only on success.
 * @returns The original result unchanged.
 *
 * @example
 * ```ts
 * const result = tap(Ok(42), value => {
 *   console.log("Success:", value);
 * });
 * // logs "Success: 42"
 * // returns Ok(42)
 * ```
 */
export function tap<T, E>(
  result: Result<T, E>,
  fn: (_value: T) => void,
): Result<T, E> {
  if (result.ok) {
    fn(result.value);
  }

  return result;
}

/**
 * Runs a side-effect on the error value of a {@link Result},
 * then returns the original result unchanged.
 *
 * Useful for logging, tracing, or debugging failures in a pipeline.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to inspect.
 * @param fn - Side-effect function run only on errors.
 * @returns The original result unchanged.
 *
 * @example
 * ```ts
 * const result = tapErr(Err("not found"), error => {
 *   console.error("Failure:", error);
 * });
 * // logs "Failure: not found"
 * // returns Err("not found")
 * ```
 */
export function tapErr<T, E>(
  result: Result<T, E>,
  fn: (_error: E) => void,
): Result<T, E> {
  if (!result.ok) {
    fn(result.error);
  }
  return result;
}

/**
 * Flattens a nested {@link Result} by one level.
 *
 * This is useful when you have a `Result<Result<T, E>, E>` and want
 * a plain `Result<T, E>`.
 *
 * @typeParam T - The inner success type.
 * @typeParam E - The error type shared by both layers.
 * @param result - The nested result to flatten.
 * @returns The flattened result.
 *
 * @example
 * ```ts
 * const a = flatten(Ok(Ok(42)));
 * // Ok(42)
 * ```
 *
 * @example
 * ```ts
 * const b = flatten(Ok(Err("fail")));
 * // Err("fail")
 * ```
 *
 * @example
 * ```ts
 * const c = flatten(Err("outer fail"));
 * // Err("outer fail")
 * ```
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
  return result.ok ? result.value : result;
}

/**
 * Collects all successful values and all errors from an array of results.
 *
 * Unlike {@link all}, this does not stop at the first failure.
 * If at least one error is present, it returns `Err(E[])`.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error type.
 * @param results - Array of results to combine.
 * @returns `Ok` with all values if no errors occurred, otherwise `Err` with all errors.
 *
 * @example
 * ```ts
 * const result = combine([Ok(1), Ok(2), Ok(3)]);
 * // Ok([1, 2, 3])
 * ```
 *
 * @example
 * ```ts
 * const result = combine([Ok(1), Err("bad"), Err("oops")]);
 * // Err(["bad", "oops"])
 * ```
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
  const values: T[] = [];
  const errors: E[] = [];
  const ERRORS_TRESHOLD = 0;
  for (const result of results) {
    if (result.ok) values.push(result.value);
    else errors.push(result.error);
  }

  return errors.length > ERRORS_TRESHOLD ? Err(errors) : Ok(values);
}

/**
 * Filters the success value of a {@link Result} with a predicate.
 *
 * If the input result is already an error, it is returned unchanged.
 * If the input is successful but fails the predicate, a new error is produced.
 *
 * @typeParam T - The success type.
 * @typeParam E - The existing error type.
 * @typeParam F - The new error type produced when the predicate fails.
 * @param result - The result to validate.
 * @param predicate - Predicate applied to the success value.
 * @param onFalse - Function used to build the new error when validation fails.
 * @returns The original success, the original error, or a new validation error.
 *
 * @example
 * ```ts
 * const result = filter(
 *   Ok(10),
 *   n => n > 5,
 *   n => `Too small: ${n}`
 * );
 * // Ok(10)
 * ```
 *
 * @example
 * ```ts
 * const result = filter(
 *   Ok(2),
 *   n => n > 5,
 *   n => `Too small: ${n}`
 * );
 * // Err("Too small: 2")
 * ```
 */
export function filter<T, E, F>(
  result: Result<T, E>,
  predicate: (_value: T) => boolean,
  onFalse: (_value: T) => F,
): Result<T, E | F> {
  if (!result.ok) {
    return result;
  }

  return predicate(result.value) ? result : Err(onFalse(result.value));
}

/**
 * Filters the success value of a {@link Result} with a predicate,
 * using the same error type for both the original error and validation error.
 *
 * This is a stricter version of {@link filter} when you want to preserve
 * a single consistent error type.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @param result - The result to validate.
 * @param predicate - Predicate applied to the success value.
 * @param onFalse - Function used to build an error of the same type when validation fails.
 * @returns The original success, the original error, or a validation error of the same type.
 *
 * @example
 * ```ts
 * const result = filterSameErr(
 *   Ok(10),
 *   n => n % 2 === 0,
 *   n => `Not even: ${n}`
 * );
 * // Ok(10)
 * ```
 *
 * @example
 * ```ts
 * const result = filterSameErr(
 *   Ok(3),
 *   n => n % 2 === 0,
 *   n => `Not even: ${n}`
 * );
 * // Err("Not even: 3")
 * ```
 */
export function filterSameErr<T, E>(
  result: Result<T, E>,
  predicate: (_value: T) => boolean,
  onFalse: (_value: T) => E,
): Result<T, E> {
  if (!result.ok) {
    return result;
  }

  return predicate(result.value) ? result : Err(onFalse(result.value));
}
