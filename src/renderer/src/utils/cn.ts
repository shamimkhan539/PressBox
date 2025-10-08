/**
 * Utility function to merge class names
 *
 * Simple class name concatenation for development.
 * In production, this would use clsx and tailwind-merge.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(" ");
}
