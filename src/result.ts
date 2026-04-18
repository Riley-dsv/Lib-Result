/**
 * Represents a pair of handlers used to pattern-match a {@link Result}.
 *
 * The `ok` handler is called when the result is successful.
 * The `err` handler is called when the result is a failure.
 *
 * Both handlers must return the same output type.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error value type.
 * @typeParam U - The common return type of both handlers.
 *
 * @example
 * ```ts
 * const handlers: ResultHandler<number, string, string> = {
 *   ok: value => `Success: ${value}`,
 *   err: error => `Failure: ${error}`,
 * };
 * ```
 */
export interface ResultHandler<T, E, U> {
  /**
   * Handles the success branch of a result.
   *
   * @param _value - The successful value.
   * @returns A value of the common output type.
   */
  ok: (_value: T) => U;

  /**
   * Handles the error branch of a result.
   *
   * @param _error - The error value.
   * @returns A value of the common output type.
   */
  err: (_error: E) => U;
}

/**
 * Internal discriminated-union shape for a successful {@link Result}.
 *
 * This type is not part of the public API surface.
 * It exists to model the success branch of `Result<T, E>`.
 *
 * @internal
 * @typeParam T - The success value type.
 *
 * @example
 * ```ts
 * const result: Ok<number> = {
 *   ok: true,
 *   value: 42,
 * };
 * ```
 */
type Ok<T> = {
  /**
   * Discriminant indicating that the result is successful.
   */
  ok: true;

  /**
   * The successful value carried by the result.
   */
  value: T;
};

/**
 * Internal discriminated-union shape for a failed {@link Result}.
 *
 * This type is not part of the public API surface.
 * It exists to model the error branch of `Result<T, E>`.
 *
 * @internal
 * @typeParam E - The error value type.
 *
 * @example
 * ```ts
 * const result: Err<string> = {
 *   ok: false,
 *   error: "Something went wrong",
 * };
 * ```
 */
type Err<E> = {
  /**
   * Discriminant indicating that the result is a failure.
   */
  ok: false;

  /**
   * The error value carried by the result.
   */
  error: E;
};

/**
 * Represents the outcome of an operation that can either succeed or fail.
 *
 * A successful result has the shape `{ ok: true, value: T }`.
 * A failed result has the shape `{ ok: false, error: E }`.
 *
 * This is the main public result type used throughout the module.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error value type.
 *
 * @example
 * ```ts
 * const success: Result<number, string> = { ok: true, value: 123 };
 * ```
 *
 * @example
 * ```ts
 * const failure: Result<number, string> = { ok: false, error: "Invalid input" };
 * ```
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Represents an asynchronous {@link Result}.
 *
 * This is a promise that resolves to a `Result<T, E>`.
 *
 * Use this type for async APIs that preserve the same success/error model.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error value type.
 *
 * @example
 * ```ts
 * const fetchUser = async (): ResultAsync<{ id: number }, string> => {
 *   return { ok: true, value: { id: 1 } };
 * };
 * ```
 */
export type ResultAsync<T, E> = Promise<Result<T, E>>;

/**
 * Represents the output of partitioning multiple {@link Result} values.
 *
 * All successful values are collected in `oks`.
 * All error values are collected in `errs`.
 *
 * This type is useful when you want to keep both branches instead of failing fast.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error value type.
 *
 * @example
 * ```ts
 * const partitioned: PartitionResult<number, string> = {
 *   oks: [1, 2, 3],
 *   errs: ["bad input", "timeout"],
 * };
 * ```
 */
export type PartitionResult<T, E> = {
  /**
   * All successful values.
   */
  oks: T[];

  /**
   * All error values.
   */
  errs: E[];
};

/**
 * Checks whether a {@link Result} is successful.
 *
 * This function is a TypeScript type guard. When it returns `true`,
 * `result` is narrowed to the success branch and `result.value`
 * becomes safely accessible.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error value type.
 * @param result - The result to inspect.
 * @returns `true` if the result is successful, otherwise `false`.
 *
 * @example
 * ```ts
 * const result: Result<number, string> = { ok: true, value: 42 };
 *
 * if (isOk(result)) {
 *   console.log(result.value);
 * }
 * ```
 *
 * @example
 * ```ts
 * const result: Result<number, string> = { ok: false, error: "Oops" };
 *
 * if (isOk(result)) {
 *   console.log(result.value);
 * } else {
 *   console.log("The result is an error");
 * }
 * ```
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/**
 * Checks whether a {@link Result} is a failure.
 *
 * This function is a TypeScript type guard. When it returns `true`,
 * `result` is narrowed to the error branch and `result.error`
 * becomes safely accessible.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error value type.
 * @param result - The result to inspect.
 * @returns `true` if the result is a failure, otherwise `false`.
 *
 * @example
 * ```ts
 * const result: Result<number, string> = { ok: false, error: "Oops" };
 *
 * if (isErr(result)) {
 *   console.log(result.error);
 * }
 * ```
 *
 * @example
 * ```ts
 * const result: Result<number, string> = { ok: true, value: 42 };
 *
 * if (isErr(result)) {
 *   console.log(result.error);
 * } else {
 *   console.log("The result is successful");
 * }
 * ```
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}
