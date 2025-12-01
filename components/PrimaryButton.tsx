import clsx from "clsx";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";

type ButtonShape = "soft" | "pill";

type BaseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  shape?: ButtonShape;
  asChild?: boolean;
};

const utilityClasses =
  "transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-energy-tint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--omni-bg-paper)] disabled:opacity-60 disabled:pointer-events-none";

const shapeClasses: Record<ButtonShape, string> = {
  soft: "",
  pill: "rounded-full",
};

function createButton(variant: "primary" | "secondary") {
  const base =
    variant === "primary"
      ? "omni-btn-primary"
      : "omni-btn-secondary";

  return forwardRef<HTMLButtonElement, BaseButtonProps>(function Button(
    { asChild = false, shape = "soft", className, type, children, ...rest },
    ref,
  ) {
    const combined = clsx(base, shapeClasses[shape], utilityClasses, className);

    if (asChild) {
      if (!isValidElement(children)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("PrimaryButton/SecondaryButton with asChild requires a single child element.");
        }
        return null;
      }
      const element = children as ReactElement<{ className?: string }>;
      return cloneElement(element, {
        ...rest,
        className: clsx(element.props.className, combined),
      });
    }

    return (
      <button ref={ref} type={type ?? "button"} className={combined} {...rest}>
        {children}
      </button>
    );
  });
}

export const PrimaryButton = createButton("primary");
export const SecondaryButton = createButton("secondary");
