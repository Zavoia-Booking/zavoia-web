import assert from "node:assert/strict";
import test from "node:test";
import {
  getPlainTextApiError,
  plainTextErrorMessage,
  validatePlainText,
} from "./free-text.ts";

const options = { required: true, maxLength: 9500 };

test("plain text preserves Romanian, punctuation, multiline messages and literal comparisons", () => {
  for (const value of [
    "Întrebări despre programare: mulțumesc! Și mâine?",
    "First line.\nA second line\r\n\tA tabbed line.",
    "It's fine: “quotes”, apostrophes, & punctuation — 100%.",
    "Price < 50 RON and 100 > 50. The answer is 2 < 3.",
    "A review with an emoji 🙂 and a heart ♥.",
    "The literal text &lt;script&gt; is displayed as plain text.",
    "SELECT * FROM appointments WHERE note = 'a customer question';",
  ]) {
    assert.equal(validatePlainText(value, options), null, value);
  }
});

test("plain text rejects tags, script syntax and unsupported controls without removing input", () => {
  for (const value of [
    "<script>alert(1)</script>", "<SCRIPT", "</ script", "<iframe",
    "<img src=x onerror=alert(1)>", "A <strong>formatted</strong> message",
    "<!-- hidden text -->", "<!DOCTYPE html>",
    "javascript:alert(1)", "VBScript : Run()", "onclick =alert(1)",
    "onload=alert(1)", "before\u0000after", "before\u000bafter",
    "before\u000cafter", "before\u001fafter", "before\u007fafter",
  ]) {
    assert.equal(validatePlainText(value, options), "unsafe", value);
    assert.ok(value.length > 0);
  }
});

test("required fields reject blank messages while optional comments can remain empty", () => {
  for (const value of ["", " ", "\t\r\n "]) {
    assert.equal(validatePlainText(value, options), "required");
    assert.equal(validatePlainText(value, { maxLength: 2000 }), null);
  }
  assert.equal(validatePlainText("\u0000", options), "unsafe");
});

test("length validation uses the native textarea's UTF-16 limit without trimming away characters", () => {
  assert.equal(validatePlainText("a".repeat(9500), options), null);
  assert.equal(validatePlainText("a".repeat(9501), options), "tooLong");
  assert.equal(validatePlainText("🙂", { maxLength: 2 }), null);
  assert.equal(validatePlainText("🙂", { maxLength: 1 }), "tooLong");
  assert.equal(validatePlainText(" ab ", { maxLength: 3 }), "tooLong");
});

test("oversized unfinished markup remains bounded and still respects content and length rules", () => {
  const fragments = "<a".repeat(50000);
  const whitespace = `<${" ".repeat(100000)}`;
  assert.equal(validatePlainText(fragments, options), "tooLong");
  assert.equal(validatePlainText(whitespace, options), "tooLong");
  assert.equal(validatePlainText(`${fragments}>`, options), "unsafe");
  assert.equal(validatePlainText(`${fragments}<script`, options), "unsafe");
  assert.equal(validatePlainText(`${whitespace}/ SCRIPT`, options), "unsafe");
});

test("API validation codes resolve direct and nested DTO errors to the field's reason", () => {
  for (const [code, reason] of [
    ["VALIDATION.PLAIN_TEXT_UNSAFE", "unsafe"],
    ["VALIDATION.PLAIN_TEXT_REQUIRED", "required"],
    ["VALIDATION.PLAIN_TEXT_TOO_LONG", "tooLong"],
  ]) {
    assert.equal(getPlainTextApiError({ code }), reason);
    assert.equal(getPlainTextApiError({ message: code }), reason);
    assert.equal(getPlainTextApiError({ data: { message: code } }), reason);
    assert.equal(getPlainTextApiError({ data: { message: ["An unrelated DTO error", code] } }), reason);
    assert.equal(getPlainTextApiError({ data: { message: [`professionalRatings.0.comment.${code}`] } }), reason);
  }
});

test("unrelated or malformed API failures do not become fabricated validation messages", () => {
  for (const error of [null, undefined, 400, "Network error", {},
    { message: "The request failed." }, { data: { message: [null, 123, {}] } },
    { code: "OTHER.VALIDATION.PLAIN_TEXT_UNSAFE_SUFFIX" },
  ]) {
    assert.equal(getPlainTextApiError(error), null);
  }
});

test("validation copy localizes the length limit and does not emit empty error rows", () => {
  const en = { required: "Enter a message.", unsafe: "Remove HTML tags or scripts from your text.",
    tooLong: "Maximum {max} characters." };
  const ro = { required: "Scrie un mesaj.", unsafe: "Elimină codul HTML sau scripturile din text.",
    tooLong: "Maximum {max} de caractere." };
  assert.equal(plainTextErrorMessage(null, en, 9500, "en"), null);
  assert.equal(plainTextErrorMessage("unsafe", en, 9500, "en"), en.unsafe);
  assert.equal(plainTextErrorMessage("required", ro, 9500, "ro"), ro.required);
  assert.equal(plainTextErrorMessage("tooLong", en, 9500, "en"), "Maximum 9,500 characters.");
  assert.equal(plainTextErrorMessage("tooLong", ro, 9500, "ro"), "Maximum 9.500 de caractere.");
});
