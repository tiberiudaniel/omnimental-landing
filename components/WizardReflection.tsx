"use client";

import ReflectionScreen from "./ReflectionScreen";

type WizardReflectionProps = {
  lines: string[];
  onContinue: () => void;
  categories?: Array<{ category: string; count: number }>;
  maxSelection?: number;
  categoryLabels?: Record<string, string>;
};

export default function WizardReflection({
  lines,
  onContinue,
  categories,
  maxSelection,
  categoryLabels,
}: WizardReflectionProps) {
  return (
    <ReflectionScreen
      lines={lines}
      onContinue={onContinue}
      categories={categories}
      maxSelection={maxSelection}
      categoryLabels={categoryLabels}
    />
  );
}
