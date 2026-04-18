import { Result, ResultAsync } from "./result";
import { all, combine, Err, Ok } from "./result.helper";

/**
 * Asynchronously maps the success value of a {@link ResultAsync},
 * leaving errors unchanged.
 *
 * This function awaits the async result first, then applies the async mapper
 * only if the result is successful.
 *
 * @typeParam T - The input success type.
 * @typeParam E - The error type.
 * @typeParam U - The output success type.
 * @param asyncResult - A promise resolving to a result.
 * @param fn - Async function applied only to successful values.
 * @returns A promise resolving to the mapped result.
 *
 * @example
 * ```ts
 * const userNameResult = await mapAsync(fetchUserResult(), async user => {
 *   return await fetchDisplayName(user.id);
 * });
 * ```
 *
 * @example
 * ```ts
 * const result = await mapAsync(Promise.resolve(Ok(5)), async n => n * 2);
 * // Ok(10)
 * ```
 */
export async function mapAsync<T, E, U>(
  asyncResult: ResultAsync<T, E>,
  fn: (_value: T) => Promise<U>,
): ResultAsync<U, E> {
  const result = await asyncResult;
  return result.ok ? Ok(await fn(result.value)) : result;
}

/**
 * Asynchronously maps the error value of a {@link ResultAsync},
 * leaving success values unchanged.
 *
 * @typeParam T - The success type.
 * @typeParam E - The input error type.
 * @typeParam F - The output error type.
 * @param asyncResult - A promise resolving to a result.
 * @param fn - Async function applied only to errors.
 * @returns A promise resolving to the mapped result.
 *
 * @example
 * ```ts
 * const result = await mapErrAsync(
 *   Promise.resolve(Err("timeout")),
 *   async error => `Network error: ${error}`
 * );
 * // Err("Network error: timeout")
 * ```
 *
 * @example
 * ```ts
 * const result = await mapErrAsync(
 *   Promise.resolve(Ok(42)),
 *   async error => `Network error: ${error}`
 * );
 * // Ok(42)
 * ```
 */
export async function mapErrAsync<T, E, F>(
  asyncResult: ResultAsync<T, E>,
  fn: (_error: E) => Promise<F>,
): ResultAsync<T, F> {
  const result = await asyncResult;
  return result.ok ? result : Err(await fn(result.error));
}

/**
 * Asynchronously chains another result-producing function onto a successful
 * {@link ResultAsync}.
 *
 * If the awaited input result is an error, it is returned unchanged.
 *
 * @typeParam T - The input success type.
 * @typeParam E - The error type.
 * @typeParam U - The output success type.
 * @param asyncResult - A promise resolving to a result.
 * @param fn - Function returning the next async result on success.
 * @returns A promise resolving to the chained result.
 *
 * @example
 * ```ts
 * const result = await andThenAsync(fetchUserResult(), user => fetchOrdersResult(user.id));
 * ```
 *
 * @example
 * ```ts
 * const result = await andThenAsync(
 *   Promise.resolve(Err("unauthorized")),
 *   async value => Ok(value)
 * );
 * // Err("unauthorized")
 * ```
 */
export async function andThenAsync<T, E, U>(
  asyncResult: ResultAsync<T, E>,
  fn: (_value: T) => ResultAsync<U, E>,
): ResultAsync<U, E> {
  const result = await asyncResult;
  return result.ok ? fn(result.value) : result;
}

/**
 * Asynchronously recovers from an error by providing an alternative
 * {@link ResultAsync}.
 *
 * If the awaited input result is successful, it is returned unchanged.
 *
 * @typeParam T - The success type.
 * @typeParam E - The input error type.
 * @typeParam F - The recovery error type.
 * @param asyncResult - A promise resolving to a result.
 * @param fn - Async function used to recover from errors.
 * @returns A promise resolving to the original success or recovery result.
 *
 * @example
 * ```ts
 * const result = await orElseAsync(
 *   Promise.resolve(Err("timeout")),
 *   async () => Ok("cached value")
 * );
 * // Ok("cached value")
 * ```
 *
 * @example
 * ```ts
 * const result = await orElseAsync(
 *   Promise.resolve(Ok("live value")),
 *   async () => Ok("cached value")
 * );
 * // Ok("live value")
 * ```
 */
export async function orElseAsync<T, E, F>(
  asyncResult: ResultAsync<T, E>,
  fn: (_error: E) => ResultAsync<T, F>,
): ResultAsync<T, F> {
  const result = await asyncResult;
  return result.ok ? result : fn(result.error);
}

/**
 * Resolves an array of async results and combines all successes or all errors.
 *
 * If any errors are present, all of them are returned together.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error type.
 * @param asyncResults - Array of promises resolving to results.
 * @returns A promise resolving to `Ok(T[])` or `Err(E[])`.
 *
 * @example
 * ```ts
 * const result = await combineAsync([
 *   Promise.resolve(Ok(1)),
 *   Promise.resolve(Err("bad")),
 *   Promise.resolve(Err("oops")),
 * ]);
 * // Err(["bad", "oops"])
 * ```
 */
export async function combineAsync<T, E>(
  asyncResults: Result<T, E>[],
): Promise<Result<T[], E[]>> {
  const resolved = await Promise.all(asyncResults);
  return combine(resolved);
}

/**
 * Converts a throwing or rejecting asynchronous function into a {@link Result}.
 *
 * This is useful for wrapping promise-based APIs that may reject.
 *
 * @typeParam T - The success type.
 * @typeParam E - The mapped error type.
 * @param fn -  function that may throw or reject.
 * @param mapError - Function used to convert unknown thrown values into your error type.
 * @returns A promise resolving to `Ok` with the value, or `Err` with the mapped error.
 *
 * @example
 * ```ts
 * const result = await fromThrowable(
 *   async () => await fetch("/api/user").then(r => r.json()),
 *   error => `Request failed: ${String(error)}`
 * );
 * ```
 *
 * @example
 * ```ts
 * const result = await fromThrowable(
 *   async () => {
 *     throw new Error("Network down");
 *   },
 *   error => String(error)
 * );
 * // Err("Error: Network down")
 * ```
 */
export async function fromThrowableAsync<T, E = unknown>(
  fn: () => Promise<T>,
  mapError: (_error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(mapError(error));
  }
}

/**
 * hronously pattern-matches a {@link ResultAsync} using handlers
 * for both branches.
 *
 * Each handler may be synchronous or asynchronous.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @typeParam U - The output type produced by both handlers.
 * @param asyncResult - A promise resolving to a result.
 * @param handlers - Object containing success and error handlers.
 * @returns A promise resolving to the value produced by the matching handler.
 *
 * @example
 * ```ts
 * const message = await match(fetchUserResult(), {
 *   ok: async user => `Hello ${user.name}`,
 *   err: async error => `Error: ${error}`,
 * });
 * ```
 *
 * @example
 * ```ts
 * const message = await match(Promise.resolve(Err("forbidden")), {
 *   ok: value => `Value: ${value}`,
 *   err: error => `Error: ${error}`,
 * });
 * // "Error: forbidden"
 * ```
 * */
/* eslint-disable max-lines-per-function */
export async function matchAsync<T, E, U>(
  asyncResult: Result<T, E>,
  handlers: {
    ok: (_value: T) => U | Promise<U>;
    err: (_error: E) => U | Promise<U>;
  },
): Promise<U> {
  const result = await asyncResult;
  return result.ok
    ? await handlers.ok(result.value)
    : await handlers.err(result.error);
}
/* eslint-enable max-lines-per-function */

/**
 * Resolves an array of async results and collects them into a single result
 * containing an array of values.
 *
 * Returns the first error found after all promises are resolved.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error type.
 * @param asyncResults - Array of promises resolving to results.
 * @returns A promise resolving to `Ok` with all values, or the first `Err`.
 *
 * @example
 * ```ts
 * const result = await all([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3),
 * ]);
 * ```
 *
 * @example
 * ```ts
 * const result = await all([
 *   Promise.resolve(Ok(1)),
 *   Promise.resolve(Err("bad")),
 *   Promise.resolve(Ok(3)),
 * ]);
 * // Err("bad")
 * ```
 */
export async function allAsync<T, E>(
  asyncResults: Result<T, E>[],
): Promise<Result<T[], E>> {
  const resolved = await Promise.all(asyncResults);
  return all(resolved);
}
