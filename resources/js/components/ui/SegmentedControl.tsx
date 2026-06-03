/**
 * SegmentedControl: Reusable pill-style toggle component
 * 
 * Usage:
 * ```tsx
 * <SegmentedControl<Orientation>
 *   label="Orientation"
 *   icon={AlignCenter}
 *   value={orientation}
 *   onChange={setOrientation}
 *   options={[
 *     { value: "portrait", label: "Portrait" },
 *     { value: "landscape", label: "Landscape" },
 *   ]}
 * />
 * ```
 */

import React from "react";

export interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

export interface SegmentedControlProps<T extends string> {
    /** Display label for the control */
    label: string;

    /** Icon component to display next to label */
    icon: React.ElementType;

    /** Current selected value */
    value: T;

    /** Callback when value changes */
    onChange: (value: T) => void;

    /** Available options */
    options: SegmentedOption<T>[];

    /** Additional CSS classes */
    className?: string;

    /** Accessibility label */
    ariaLabel?: string;
}

/**
 * Segmented control component with icon support
 * Renders as a pill-style button group with visual feedback
 */
export const SegmentedControl = React.forwardRef<
    HTMLDivElement,
    SegmentedControlProps<any>
>(
    (
        {
            label,
            icon: Icon,
            value,
            onChange,
            options,
            className = "",
            ariaLabel,
        },
        ref
    ) => {
        return (
            <div ref={ref} className={`flex flex-col gap-2 ${className}`}>
                {/* Label with icon */}
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    <Icon
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                    />
                    <span>{label}</span>
                </div>

                {/* Control group */}
                <div
                    role="group"
                    aria-label={ariaLabel || label}
                    className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
                >
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            aria-pressed={value === opt.value}
                            className={`flex-1 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                value === opt.value
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                            title={opt.label}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
);

SegmentedControl.displayName = "SegmentedControl";
