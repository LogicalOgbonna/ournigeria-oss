import {
  LocationChip,
  NameField,
  PartyField,
  OptionalDetails,
  SourceField,
  ErrorBox,
  SubmitButton,
  useIdentifyForm,
} from "@/components/proposals/identify-form";
import { Show } from "@/components/ui/Show";

type IdentifyFormApi = ReturnType<typeof useIdentifyForm>;

/** Step 2 (blank-form path): capture the person holding the confirmed seat. */
export function IdentifyForm({
  form,
  showChangeLocation,
  changeLabel,
  onChangeLocation,
}: {
  form: IdentifyFormApi;
  showChangeLocation: boolean;
  changeLabel: string;
  onChangeLocation: () => void;
}) {
  return (
    <div className="space-y-5">
      <LocationChip form={form} />
      <Show when={showChangeLocation}>
        <button
          type="button"
          onClick={onChangeLocation}
          className="text-xs text-emerald-600 hover:underline"
        >
          ← {changeLabel}
        </button>
      </Show>
      <NameField form={form} />
      <PartyField form={form} />
      <OptionalDetails form={form} />
      <SourceField form={form} />
      <ErrorBox message={form.error} />
      <SubmitButton form={form} label="Submit Identification" />
      <p className="text-xs text-slate-400 text-center">
        Identifications are reviewed by admin before being published. You can submit up to 5 proposals per day.
      </p>
    </div>
  );
}
