import {
  RoleField,
  LocationField,
  useIdentifyForm,
} from "@/components/proposals/identify-form";
import { Show } from "@/components/ui/Show";

type IdentifyFormApi = ReturnType<typeof useIdentifyForm>;

/** Step 1 of the identify flow: pick the seat (role + location) before the form. */
export function IdentifyGate({
  form,
  onContinue,
}: {
  form: IdentifyFormApi;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
          Identify an official
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Tell us the seat, then the person who holds it.
        </p>
      </div>
      <div className="space-y-4">
        <RoleField form={form} />
        <Show when={!!form.role}>
          <LocationField form={form} />
        </Show>
        <button
          type="button"
          disabled={!form.role || !form.locationComplete}
          onClick={onContinue}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </>
  );
}
