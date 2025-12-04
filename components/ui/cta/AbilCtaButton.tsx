import type { OmniCtaButtonProps } from "@/components/ui/OmniCtaButton";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export function AbilCtaButton(props: Omit<OmniCtaButtonProps, "variant">) {
  return <OmniCtaButton variant="abil" {...props} />;
}
