import { test } from "node:test";
import assert from "node:assert/strict";
import { formatEuros, parseEuros } from "../src/index.ts";

const compact = (value) => value.replace(/[\s\u202f\u00a0]/g, "");

test("FIN-R01: euro display preserves small amounts, zero and negative cents", () => {
  for (const [cents, expected] of [
    [0, "0,00€"],
    [1, "0,01€"],
    [10, "0,10€"],
    [99, "0,99€"],
    [100, "1,00€"],
    [1234, "12,34€"],
    [210000, "2100,00€"],
    [-1, "-0,01€"],
    [-99, "-0,99€"],
    [-1234, "-12,34€"],
  ]) assert.equal(compact(formatEuros(cents)), expected);
});

test("FIN-R01: accepted maximum retains its final cent on display", () => {
  const cents = parseEuros("90071992547409,91");
  assert.equal(cents, Number.MAX_SAFE_INTEGER);
  assert.equal(compact(formatEuros(cents)), "90071992547409,91€");
  assert.equal(compact(formatEuros(cents - 1)), "90071992547409,90€");
  assert.equal(compact(formatEuros(-cents)), "-90071992547409,91€");
  assert.throws(() => parseEuros("90071992547409,92"), { code: "INVALID_AMOUNT" });
});

test("FIN-R01: each cent near the safe integer boundary survives display and parsing", () => {
  for (let offset = 0; offset < 1000; offset++) {
    const cents = Number.MAX_SAFE_INTEGER - offset;
    const decimal = compact(formatEuros(cents)).replace("€", "");
    assert.equal(parseEuros(decimal), cents);
    assert.equal(compact(formatEuros(-cents)), "-" + decimal + "€");
  }
});

test("FIN-R01: display rejects fractional and unsafe cents instead of rounding", () => {
  for (const cents of [0.1, NaN, Infinity, -Infinity,
    Number.MAX_SAFE_INTEGER + 1, -Number.MAX_SAFE_INTEGER - 1]) {
    assert.throws(() => formatEuros(cents), { code: "INVALID_AMOUNT" });
  }
});
