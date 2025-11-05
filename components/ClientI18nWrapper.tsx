// ./components/ClientI18nWrapper.tsx
"use client";

import { I18nProvider } from "./I18nProvider";

type Props = {
  children: React.ReactNode;
};

export default function ClientI18nWrapper({ children }: Props) {
  return <I18nProvider>{children}</I18nProvider>;
}

