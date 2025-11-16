"use client";

import ReflectionScreen from "./ReflectionScreen";

type WizardReflectionProps = {
  lines: string[];
  onContinue: () => void;
  categories?: Array<{ category: string; count: number }>;
  maxSelection?: number;
  categoryLabels?: Record<string, string>;
  testId?: string;
  cardTestId?: string;
  compact?: boolean;
};

export default function WizardReflection({
  lines,
  onContinue,
  categories,
  maxSelection,
  categoryLabels,
  testId,
  cardTestId,
  compact,
}: WizardReflectionProps) {
  return (
    <ReflectionScreen
      lines={lines}
      onContinue={onContinue}
      categories={categories}
      maxSelection={maxSelection}
      categoryLabels={categoryLabels}
      testId={testId}
      cardTestId={cardTestId}
      compact={compact}
    />
  );
}
