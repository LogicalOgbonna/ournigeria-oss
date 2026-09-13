import { AskPitch, ChatDemoPanel } from "./AskBlock";
import { HeroBackdrop } from "./HeroBackdrop";
import { HeroLocationSlot } from "./HeroLocationSlot";

/**
 * The homepage hero when the election gate is OFF (kill switch, decision C):
 * the ask pitch takes the hero position — "Follow Your LGA Money, No Gree."
 * with the mock conversation alongside — instead of the candidates rail.
 * Same pieces as the mid-page AskBlock, framed like CandidatesHero (backdrop,
 * hero top padding); the coverage stats + "you are viewing" row follow in
 * PersonalizedData exactly as they do under the election hero.
 */
export function AskHero({
  withLocationSlot = false,
}: {
  /**
   * Mount the hero's location-row portal target. Used when AskHero replaces
   * the election hero CLIENT-side (a viewer geo-filtered to zero ballot
   * content): the page told PersonalizedData a hero slot was coming, so one
   * must exist or the "you are viewing" row vanishes. The server-side
   * gate-off page leaves this off — there the row renders under the stats.
   */
  readonly withLocationSlot?: boolean;
}) {
  return (
    <div className="relative">
      <HeroBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-28 lg:px-8 lg:pt-40">
        {withLocationSlot && <HeroLocationSlot />}
        <section className="grid items-center gap-12 pb-16 pt-6 lg:grid-cols-2 lg:gap-16 lg:pb-24">
          <AskPitch title="Follow Your LGA Money," accent="No Gree." />
          <ChatDemoPanel />
        </section>
      </div>
    </div>
  );
}
