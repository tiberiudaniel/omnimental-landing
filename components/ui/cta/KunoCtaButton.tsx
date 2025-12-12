import type { OmniCtaButtonProps } from "@/components/ui/OmniCtaButton";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export function KunoCtaButton(props: Omit<OmniCtaButtonProps, "variant">) {
  return <OmniCtaButton variant="kuno" {...props} />;
}
