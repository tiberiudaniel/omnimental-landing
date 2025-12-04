import type { OmniCtaButtonProps } from "@/components/ui/OmniCtaButton";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export function NeutralCtaButton(props: Omit<OmniCtaButtonProps, "variant">) {
  return <OmniCtaButton variant="neutral" {...props} />;
}
