import { LocationPicker } from "@/components/civic/LocationPicker";

export function RepLocationPicker({
  onLocationSelect,
  initialLocation,
}: {
  onLocationSelect: (loc: any) => void;
  initialLocation: any;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-2">
        Your Representatives
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Select your location to see who represents you
      </p>
      <LocationPicker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
    </div>
  );
}
