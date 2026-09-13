import { AskPitch, ChatDemoPanel } from "./AskBlock";
import { HeroBackdrop } from "./HeroBackdrop";

/**
 * The homepage hero when the election gate is OFF (kill switch, decision C):
 * the ask pitch takes the hero position — "Follow Your LGA Money, No Gree."
 * with the mock conversation alongside — instead of the candidates rail.
 * Same pieces as the mid-page AskBlock, framed like CandidatesHero (backdrop,
 * hero top padding); the coverage stats + "you are viewing" row follow in
 * PersonalizedData exactly as they do under the election hero.
 */
export function AskHero() {
  return (
    <div className="relative">
      <HeroBackdrop />
      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-24 lg:pt-40">
        <AskPitch title="Follow Your LGA Money," accent="No Gree." />
        <ChatDemoPanel />
      </section>
    </div>
  );
}
