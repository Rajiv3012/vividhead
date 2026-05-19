// This type defines the structured semantic result consumed by UI panels.
export type ISLSemanticResult = {
  // This field stores human-readable movement action label.
  action: string;
  // This field stores interpreted grammatical intent label.
  intent: string;
  // This field stores secondary technical detail line.
  technicalDetail: string;
  // This field stores plain-English contextual interpretation.
  englishContext: string;
  // This field stores icon symbol for quick visual scanning.
  indicatorIcon: string;
  // This field stores theme color used across result highlights.
  themeColor: string;
  // This field stores pulse border utility class for movement card.
  pulseClass: string;
  // This field stores short explanation used in final summary helper.
  explanation: string;
};

// This helper normalizes source phrases from filenames or labels.
const normalizePhrase = (phrase: string): string => {
  // This line removes any file extension from phrase text.
  const noExtension = phrase.replace(/\.[^/.]+$/, "");
  // This line converts underscores and hyphens into spaces.
  const cleaned = noExtension.replace(/[_-]+/g, " ").trim();
  // This line removes trailing numeric parenthetical suffixes like "(2)".
  const deIndexed = cleaned.replace(/\s*\(\d+\)\s*$/, "").trim();
  // This line returns fallback phrase when no text is available.
  return deIndexed || "this sign";
};

// This helper converts a phrase into sentence case for readable output.
const sentenceCase = (value: string): string => {
  // This guard handles empty phrases safely.
  if (!value) {
    // This return keeps output stable for empty inputs.
    return "";
  }
  // This line capitalizes the first character and preserves remainder.
  return value.charAt(0).toUpperCase() + value.slice(1);
};

// This function maps model modifier output to human-first semantics.
export const getISLMeaning = (modifier: string, phrase: string): ISLSemanticResult => {
  // This line normalizes phrase for consistent summary generation.
  const normalizedPhrase = normalizePhrase(phrase);
  // This dictionary defines semantic mappings for known modifiers.
  const meanings: Record<string, ISLSemanticResult> = {
    // This key maps pitch motion to nodding/affirmation interpretation.
    affirmation: {
      action: "Nodding",
      intent: "Affirmation",
      technicalDetail: "Detected via Pitch Oscillation",
      englishContext: "The signer is agreeing or saying 'Yes'.",
      indicatorIcon: "✅",
      themeColor: "#4ade80",
      pulseClass: "movement-pulse-green",
      explanation: "The nod transforms the base sign into confirmation.",
    },
    // This key maps yaw motion to shaking/negation interpretation.
    negation: {
      action: "Shaking Head",
      intent: "Negation",
      technicalDetail: "Detected via Yaw Oscillation",
      englishContext: "The signer is disagreeing or saying 'No'.",
      indicatorIcon: "❌",
      themeColor: "#f87171",
      pulseClass: "movement-pulse-red",
      explanation: "The head shake transforms the base sign into a negative.",
    },
    // This key maps roll motion to tilt/questioning interpretation.
    question_uncertainty: {
      action: "Side Tilting",
      intent: "Questioning",
      technicalDetail: "Detected via Roll Oscillation",
      englishContext: "The signer is asking a question or expressing doubt.",
      indicatorIcon: "❓",
      themeColor: "#facc15",
      pulseClass: "movement-pulse-gold",
      explanation: "The side tilt transforms the base sign into an inquiry.",
    },
  };
  // This fallback handles neutral or unrecognized classifier outputs.
  const fallback: ISLSemanticResult = {
    action: "Subtle Movement",
    intent: "Unclear",
    technicalDetail: "Detected via Low Oscillation Profile",
    englishContext: "The signer did not show a strong nod, shake, or tilt signal.",
    indicatorIcon: "ℹ️",
    themeColor: "#93c5fd",
    pulseClass: "movement-pulse-blue",
    explanation: "The movement is too subtle to confidently change the base sign.",
  };
  // This line selects mapped meaning or fallback semantic result.
  const data = meanings[modifier] ?? fallback;
  // This line computes phrase text for summary composition.
  const phraseSentence = sentenceCase(normalizedPhrase);
  // This condition builds a natural-language summary for questioning.
  if (data.intent === "Questioning") {
    // This return emits fully composed semantic payload for UI.
    return {
      ...data,
      englishContext: data.englishContext,
      explanation: data.explanation,
      technicalDetail: data.technicalDetail,
      action: data.action,
      intent: data.intent,
      indicatorIcon: data.indicatorIcon,
      pulseClass: data.pulseClass,
      themeColor: data.themeColor,
    };
  }
  // This return emits mapped data for non-questioning intents.
  return {
    ...data,
    englishContext: data.englishContext,
    explanation: data.explanation,
    technicalDetail: data.technicalDetail,
    action: data.action,
    intent: data.intent,
    indicatorIcon: data.indicatorIcon,
    pulseClass: data.pulseClass,
    themeColor: data.themeColor,
  };
};

// This function creates a human-first final translation sentence.
export const buildFinalTranslation = (modifier: string, phrase: string): string => {
  // This line normalizes phrase for stable sentence output.
  const normalizedPhrase = normalizePhrase(phrase);
  // This line converts phrase into readable sentence case.
  const readablePhrase = sentenceCase(normalizedPhrase);
  // This condition formats final translation for affirmation output.
  if (modifier === "affirmation") {
    // This return provides clear affirmative sentence form.
    return `The signer is confirming: "${readablePhrase}."`;
  }
  // This condition formats final translation for negation output.
  if (modifier === "negation") {
    // This return provides clear negative sentence form.
    return `The signer is rejecting: "${readablePhrase}."`;
  }
  // This condition formats final translation for questioning output.
  if (modifier === "question_uncertainty") {
    // This return provides clear inquiry-style sentence form.
    return `The signer is asking: "${readablePhrase}?"`;
  }
  // This return provides neutral fallback when intent is uncertain.
  return `The signer is expressing: "${readablePhrase}."`;
};

// This function formats a source label for display context blocks.
export const formatDisplaySource = (sourceName: string): string => {
  // This line normalizes phrase using shared normalization helper.
  const normalized = normalizePhrase(sourceName);
  // This line converts phrase to sentence case for visible UI copy.
  return sentenceCase(normalized);
};
