import { Composition, Folder } from "remotion";
import { BudgetOverview } from "./compositions/BudgetOverview";
import { ProductDemo } from "./compositions/ProductDemo/ProductDemo";
import { StateBudget } from "./compositions/StateBudget/StateBudget";
import { CorruptionCase } from "./compositions/CorruptionCase/CorruptionCase";
import { StateComparison } from "./compositions/StateComparison/StateComparison";
import { FAACAllocation } from "./compositions/FAACAllocation/FAACAllocation";
import { MoneyCouldBuy } from "./compositions/MoneyCouldBuy/MoneyCouldBuy";
import { KnowYourReps } from "./compositions/CivicIntro/KnowYourReps/KnowYourReps";
import { CommunityPower } from "./compositions/CivicIntro/CommunityPower/CommunityPower";
import { ProposeAndVerify } from "./compositions/CivicIntro/ProposeAndVerify/ProposeAndVerify";
import { LeaderboardChallenge } from "./compositions/CivicIntro/LeaderboardChallenge/LeaderboardChallenge";
import { JoinTheMovement } from "./compositions/CivicIntro/JoinTheMovement/JoinTheMovement";
import "./styles/global.css";

export const RemotionRoot = () => {
  return (
    <>
      {/* Existing 16:9 compositions */}
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BudgetOverview"
        component={BudgetOverview}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Social media 9:16 compositions */}
      <Composition
        id="StateBudget"
        component={StateBudget}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          stateName: "Lagos",
          stateCode: "lagos",
          fiscalYear: 2024,
          totalBudget: 1_190_000_000_000,
          sectors: [
            { label: "Infrastructure", value: 24, color: "#d97706" },
            { label: "Education", value: 18, color: "#059669" },
            { label: "Health", value: 14, color: "#0891b2" },
            { label: "Agriculture", value: 8, color: "#65a30d" },
            { label: "Other", value: 36, color: "#64748b" },
          ],
          topSector: "Infrastructure",
          topSectorPercent: 24,
          pidginCaption:
            "See as Lagos take ₦1.2T budget for 2024. Infrastructure carry 24% — na dem chop pass.",
        }}
      />
      <Composition
        id="CorruptionCase"
        component={CorruptionCase}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          officialName: "Sample Official",
          agency: "Ministry of Finance",
          amountAlleged: 2_500_000_000,
          status: "ongoing",
          state: "Lagos",
          details:
            "Alleged misappropriation of public funds through fraudulent contracts and inflated procurement costs.",
          pidginCaption:
            "Sample Official allegedly chop ₦2.5B government money. Case still dey court.",
        }}
      />
      <Composition
        id="StateComparison"
        component={StateComparison}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          state1Name: "Lagos",
          state2Name: "Kano",
          fiscalYear: 2024,
          state1TotalBudget: 1_190_000_000_000,
          state2TotalBudget: 350_000_000_000,
          state1Sectors: [
            { label: "Infrastructure", value: 24, color: "#d97706" },
            { label: "Education", value: 18, color: "#059669" },
            { label: "Health", value: 14, color: "#0891b2" },
          ],
          state2Sectors: [
            { label: "Education", value: 22, color: "#059669" },
            { label: "Health", value: 16, color: "#0891b2" },
            { label: "Infrastructure", value: 20, color: "#d97706" },
          ],
          state1TopSector: "Infrastructure",
          state2TopSector: "Education",
          pidginCaption:
            "Lagos vs Kano — who spend pass? Na Lagos carry am with ₦1.2T.",
        }}
      />
      <Composition
        id="FAACAllocation"
        component={FAACAllocation}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          stateName: "Lagos",
          fiscalYear: 2024,
          totalAllocation: 180_000_000_000,
          monthlyData: [
            { month: "Jan", amount: 15_000_000_000 },
            { month: "Feb", amount: 14_500_000_000 },
            { month: "Mar", amount: 16_200_000_000 },
            { month: "Apr", amount: 13_800_000_000 },
            { month: "May", amount: 15_500_000_000 },
            { month: "Jun", amount: 14_000_000_000 },
          ],
          pidginCaption:
            "FG send ₦180.0B give Lagos for 2024. Wetin dem use am do?",
        }}
      />
      <Composition
        id="MoneyCouldBuy"
        component={MoneyCouldBuy}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          stateName: "Lagos",
          fiscalYear: 2024,
          amount: 215_800_000_000,
          context: "Education Budget",
          pidginCaption:
            "₦215.8B fit build 10,790 primary schools. Think am well.",
        }}
      />

      {/* Civic community intro videos — 16:9 (1920x1080) */}
      <Folder name="CivicIntro">
        <Composition
          id="KnowYourReps"
          component={KnowYourReps}
          durationInFrames={690}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="CommunityPower"
          component={CommunityPower}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="ProposeAndVerify"
          component={ProposeAndVerify}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="LeaderboardChallenge"
          component={LeaderboardChallenge}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="JoinTheMovement"
          component={JoinTheMovement}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
