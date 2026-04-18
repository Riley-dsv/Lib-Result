import { describe, expect, it, vi } from "vitest";

import {
  Ok,
  Err,
  map,
  mapErr,
  bimap,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  andThen,
  orElse,
  expect as expectResult,
  ensure,
  match,
  fromThrowable,
  fromNullable,
  toPromise,
  all,
  partition,
  tap,
  tapErr,
  flatten,
  combine,
  filter,
  filterSameErr,
} from "../src/result.helper";

import {
  allAsync,
  andThenAsync,
  combineAsync,
  fromThrowableAsync,
  mapAsync,
  mapErrAsync,
  matchAsync,
  orElseAsync,
} from "../src/async.result.helper";

import { isOk, isErr, type Result, type ResultAsync } from "../src/result";

describe("Result constructors and type guards", () => {
  it("creates an Ok result", () => {
    expect(Ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("creates an Err result", () => {
    expect(Err("fail")).toEqual({ ok: false, error: "fail" });
  });

  it("isOk returns true only for successful results", () => {
    expect(isOk(Ok(1))).toBe(true);
    expect(isOk(Err("x"))).toBe(false);
  });

  it("isErr returns true only for failed results", () => {
    expect(isErr(Ok(1))).toBe(false);
    expect(isErr(Err("x"))).toBe(true);
  });
});

describe("map / mapErr / bimap", () => {
  it("map transforms the success value", () => {
    expect(map(Ok(2), (n) => n * 3)).toEqual(Ok(6));
  });

  it("map leaves errors unchanged", () => {
    const result: Result<number, string> = Err("bad");
    expect(map(result, (n) => n * 2)).toEqual(Err("bad"));
  });

  it("mapErr transforms the error value", () => {
    expect(mapErr(Err("bad"), (e) => `error:${e}`)).toEqual(Err("error:bad"));
  });

  it("mapErr leaves success unchanged", () => {
    expect(mapErr(Ok(10), (e) => `error:${e}`)).toEqual(Ok(10));
  });

  it("bimap maps the success branch", () => {
    expect(
      bimap(
        Ok(5),
        (n) => n + 1,
        (e) => `x:${e}`,
      ),
    ).toEqual(Ok(6));
  });

  it("bimap maps the error branch", () => {
    expect(
      bimap(
        Err("oops"),
        (n) => n + 1,
        (e) => `x:${e}`,
      ),
    ).toEqual(Err("x:oops"));
  });
});

describe("unwrap / unwrapOr / unwrapOrElse / expect", () => {
  it("unwrap returns the success value", () => {
    expect(unwrap(Ok("hello"))).toBe("hello");
  });

  it("unwrap throws the original error on Err", () => {
    expect(() => unwrap(Err(new Error("boom")))).toThrow("boom");
  });

  it("unwrapOr returns the success value when Ok", () => {
    expect(unwrapOr(Ok(7), 0)).toBe(7);
  });

  it("unwrapOr returns the fallback when Err", () => {
    expect(unwrapOr(Err("bad"), 0)).toBe(0);
  });

  it("unwrapOrElse computes a fallback from the error", () => {
    expect(unwrapOrElse(Err("abc"), (e) => e.length)).toBe(3);
  });

  it("expect returns the success value", () => {
    expect(expectResult(Ok(99), "Expected a value")).toBe(99);
  });

  it("expect throws an Error with the custom message on Err", () => {
    expect(() => expectResult(Err("missing"), "Expected user")).toThrow(
      "Expected user: missing",
    );
  });
});

describe("andThen / orElse / ensure / filter", () => {
  function positive(n: number): Result<number, string> {
    return n > 0 ? Ok(n) : Err("must be positive");
  }

  it("andThen chains success values", () => {
    expect(andThen(Ok(4), positive)).toEqual(Ok(4));
  });

  it("andThen propagates failure from the chained function", () => {
    expect(andThen(Ok(-1), positive)).toEqual(Err("must be positive"));
  });

  it("andThen leaves original error unchanged", () => {
    const result: Result<number, string> = Err("invalid");
    expect(andThen(result, positive)).toEqual(Err("invalid"));
  });

  it("orElse recovers from an error", () => {
    expect(orElse(Err("missing"), () => Ok("fallback"))).toEqual(
      Ok("fallback"),
    );
  });

  it("orElse leaves success unchanged", () => {
    expect(orElse(Ok("real"), () => Ok("fallback"))).toEqual(Ok("real"));
  });

  it("ensure returns Ok when predicate passes", () => {
    expect(
      ensure(
        18,
        (n) => n >= 18,
        (n) => `minor:${n}`,
      ),
    ).toEqual(Ok(18));
  });

  it("ensure returns Err when predicate fails", () => {
    expect(
      ensure(
        16,
        (n) => n >= 18,
        (n) => `minor:${n}`,
      ),
    ).toEqual(Err("minor:16"));
  });

  it("filter keeps an Ok when predicate passes", () => {
    expect(
      filter(
        Ok(10),
        (n) => n > 5,
        (n) => `too small:${n}`,
      ),
    ).toEqual(Ok(10));
  });

  it("filter turns an Ok into Err when predicate fails", () => {
    expect(
      filter(
        Ok(2),
        (n) => n > 5,
        (n) => `too small:${n}`,
      ),
    ).toEqual(Err("too small:2"));
  });

  it("filter leaves an existing Err untouched", () => {
    const result: Result<number, string> = Err("bad");
    expect(
      filter(
        result,
        (n) => n > 5,
        (n) => `too small:${n}`,
      ),
    ).toEqual(Err("bad"));
  });

  it("filterSameErr preserves the same error type", () => {
    expect(
      filterSameErr(
        Ok(3),
        (n) => n % 2 === 0,
        (n) => `odd:${n}`,
      ),
    ).toEqual(Err("odd:3"));
  });
});

describe("match", () => {
  it("match executes the ok handler for successful results", () => {
    const handlers = {
      ok: (value: number) => `ok:${value}`,
      err: (error: string) => `err:${error}`,
    };

    expect(match(Ok(12), handlers)).toBe("ok:12");
  });

  it("match executes the err handler for failed results", () => {
    const handlers = {
      ok: (value: number) => `ok:${value}`,
      err: (error: string) => `err:${error}`,
    };

    const result: Result<number, string> = Err("boom");
    expect(match(result, handlers)).toBe("err:boom");
  });
});

describe("fromThrowable / fromNullable / toPromise", () => {
  it("fromThrowable wraps a successful function call", () => {
    expect(fromThrowable(() => JSON.parse('{"x":1}'), String)).toEqual(
      Ok({ x: 1 }),
    );
  });

  it("fromThrowable maps thrown errors", () => {
    const result = fromThrowable(
      () => {
        throw new Error("boom");
      },
      (error) => `wrapped:${String(error)}`,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain("wrapped:Error: boom");
    }
  });

  it("fromNullable returns Ok for non-null values", () => {
    expect(fromNullable("mail@example.com", () => "missing")).toEqual(
      Ok("mail@example.com"),
    );
  });

  it("fromNullable returns Err for nullish values", () => {
    expect(fromNullable(null, () => "missing")).toEqual(Err("missing"));
    expect(fromNullable(undefined, () => "missing")).toEqual(Err("missing"));
  });

  it("toPromise resolves for Ok", async () => {
    await expect(toPromise(Ok(123))).resolves.toBe(123);
  });

  it("toPromise rejects for Err", async () => {
    await expect(toPromise(Err("bad"))).rejects.toBe("bad");
  });
});

describe("all / partition / flatten / combine", () => {
  it("all returns all success values when every result is Ok", () => {
    expect(all([Ok(1), Ok(2), Ok(3)])).toEqual(Ok([1, 2, 3]));
  });

  it("all returns the first Err encountered", () => {
    expect(all([Ok(1), Err("bad"), Ok(3)])).toEqual(Err("bad"));
  });

  it("partition separates oks and errs", () => {
    expect(partition([Ok(1), Err("bad"), Ok(3), Err("oops")])).toEqual({
      oks: [1, 3],
      errs: ["bad", "oops"],
    });
  });

  it("flatten removes one level of nesting from Ok(Ok(...))", () => {
    expect(flatten(Ok(Ok(42)))).toEqual(Ok(42));
  });

  it("flatten returns inner Err from Ok(Err(...))", () => {
    expect(flatten(Ok(Err("inner fail")))).toEqual(Err("inner fail"));
  });

  it("flatten returns outer Err unchanged", () => {
    expect(flatten(Err("outer fail"))).toEqual(Err("outer fail"));
  });

  it("combine returns Ok when all results are successful", () => {
    expect(combine([Ok(1), Ok(2)])).toEqual(Ok([1, 2]));
  });

  it("combine collects all errors when at least one result fails", () => {
    expect(combine([Ok(1), Err("bad"), Err("oops")])).toEqual(
      Err(["bad", "oops"]),
    );
  });
});

describe("tap / tapErr", () => {
  it("tap runs a side effect only for Ok and returns the original result", () => {
    const fn = vi.fn<(value: number) => void>();
    const result = Ok(42);

    expect(tap(result, fn)).toBe(result);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it("tap does not run for Err", () => {
    const fn = vi.fn<(value: number) => void>();
    const result: Result<number, string> = Err("bad");

    expect(tap(result, fn)).toEqual(Err("bad"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("tapErr runs a side effect only for Err and returns the original result", () => {
    const fn = vi.fn<(error: string) => void>();
    const result = Err("bad");

    expect(tapErr(result, fn)).toBe(result);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("bad");
  });

  it("tapErr does not run for Ok", () => {
    const fn = vi.fn<(error: string) => void>();

    const result = tapErr(Ok(1), fn);

    expect(result).toEqual(Ok(1));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("async helpers", () => {
  it("mapAsync maps the success value of an async result", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(Ok(5));

    await expect(mapAsync(asyncResult, async (n) => n * 2)).resolves.toEqual(
      Ok(10),
    );
  });

  it("mapAsync leaves async errors unchanged", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(
      Err("bad"),
    );

    await expect(mapAsync(asyncResult, async (n) => n * 2)).resolves.toEqual(
      Err("bad"),
    );
  });

  it("mapErrAsync maps the error value of an async result", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(
      Err("bad"),
    );

    await expect(
      mapErrAsync(asyncResult, async (e) => `wrapped:${e}`),
    ).resolves.toEqual(Err("wrapped:bad"));
  });

  it("andThenAsync chains async successful results", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(Ok(4));

    await expect(
      andThenAsync(asyncResult, async (n) => (n > 0 ? Ok(n * 10) : Err("bad"))),
    ).resolves.toEqual(Ok(40));
  });

  it("orElseAsync recovers from async errors", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(
      Err("missing"),
    );

    await expect(
      orElseAsync(asyncResult, async () => Ok(999)),
    ).resolves.toEqual(Ok(999));
  });

  it("matchAsync dispatches to the ok handler", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(Ok(7));

    await expect(
      matchAsync(asyncResult, {
        ok: async (n) => `ok:${n}`,
        err: async (e) => `err:${e}`,
      }),
    ).resolves.toBe("ok:7");
  });

  it("matchAsync dispatches to the err handler", async () => {
    const asyncResult: ResultAsync<number, string> = Promise.resolve(
      Err("boom"),
    );

    await expect(
      matchAsync(asyncResult, {
        ok: async (n) => `ok:${n}`,
        err: async (e) => `err:${e}`,
      }),
    ).resolves.toBe("err:boom");
  });

  it("fromThrowableAsync wraps resolved async functions", async () => {
    await expect(fromThrowableAsync(async () => 123, String)).resolves.toEqual(
      Ok(123),
    );
  });

  it("fromThrowableAsync maps rejected async functions", async () => {
    const result = await fromThrowableAsync(
      async () => {
        throw new Error("network");
      },
      (error) => `wrapped:${String(error)}`,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toContain("wrapped:Error: network");
    }
  });

  it("allAsync returns Ok with all values when all async results succeed", async () => {
    await expect(
      allAsync([Promise.resolve(Ok(1)), Promise.resolve(Ok(2))]),
    ).resolves.toEqual(Ok([1, 2]));
  });

  it("allAsync returns the first Err after resolution", async () => {
    await expect(
      allAsync([
        Promise.resolve(Ok(1)),
        Promise.resolve(Err("bad")),
        Promise.resolve(Ok(3)),
      ]),
    ).resolves.toEqual(Err("bad"));
  });

  it("combineAsync collects all async errors", async () => {
    await expect(
      combineAsync([
        Promise.resolve(Ok(1)),
        Promise.resolve(Err("bad")),
        Promise.resolve(Err("oops")),
      ]),
    ).resolves.toEqual(Err(["bad", "oops"]));
  });
});
