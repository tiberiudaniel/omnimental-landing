"use client";

import ReflectionScreen from "./ReflectionScreen";

type WizardReflectionProps = {
  lines: string[];
  onContinue: () => void;
};

export default function WizardReflection({ lines, onContinue }: WizardReflectionProps) {
  return <ReflectionScreen lines={lines} onContinue={onContinue} />;
}
