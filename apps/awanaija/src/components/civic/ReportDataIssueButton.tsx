"use client";

/**
 * Opens the global FeedbackFab modal pre-set to the "Data Issue" category.
 * FeedbackFab listens for the `open-feedback` window event.
 */
export function ReportDataIssueButton({
  label = "Submit Information",
}: {
  readonly label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("open-feedback", { detail: { category: "data_issue" } }),
        )
      }
      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-sm transition-colors mt-2"
    >
      {label}
    </button>
  );
}
