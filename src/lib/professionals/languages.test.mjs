import assert from "node:assert/strict";
import test from "node:test";
import { professionalLanguageLabels } from "./languages.ts";

test("stored English and Romanian names follow the selected dictionary", () => {
  const values = ["Română", "English", "Germană", "Olandeză"];
  assert.deepEqual(professionalLanguageLabels(values, {
    ro: "Romanian", en: "English", de: "German", nl: "Dutch",
  }), ["Romanian", "English", "German", "Dutch"]);
  assert.deepEqual(professionalLanguageLabels(["Romanian", "EN", "Chinese", "Japanese", "Korean", "Arabic", "Hindi"], {
    ro: "Română", en: "Engleză", zh: "Chineză", ja: "Japoneză",
    ko: "Coreeană", ar: "Arabă", hi: "Hindi",
  }), ["Română", "Engleză", "Chineză", "Japoneză", "Coreeană", "Arabă", "Hindi"]);
});

test("known names normalize casing, whitespace and equivalent Unicode accents", () => {
  assert.deepEqual(professionalLanguageLabels([" ROMÂNĂ ", "Roma\u0302na\u0306", "ro"], {
    ro: "Romanian",
  }), ["Romanian", "Romanian", "Romanian"]);
});

test("unknown names and missing translations retain the original profile content", () => {
  const values = [" Regional dialect ", "Sign language", "English"];
  assert.deepEqual(professionalLanguageLabels(values, { ro: "Română" }), values);
  assert.deepEqual(values, [" Regional dialect ", "Sign language", "English"]);
});
