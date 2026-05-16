"use client";

import type { ChainEntry } from "@/lib/api";
import { NarrativeOfficialCard } from "./OfficialCard";
import { StatBlock } from "./StatBlock";

interface LocationInfo {
  stateCode: string;
  stateName: string;
  lgaCode?: string;
  lgaName?: string;
  wardCode?: string;
  wardName?: string;
}

interface StateDetails {
  name?: string;
  economy?: {
    population?: string;
    domesticDebt?: string;
    externalDebt?: string;
    gdp?: string;
  };
  stats?: { budget?: string; faac?: string; igr?: string; igrFiscalYear?: number; igrPeriod?: string };
}

interface LgaDetails {
  name?: string;
  stats?: { population?: string; faac?: string; igr?: string };
}

interface NarrativeViewProps {
  readonly chain: ChainEntry[];
  readonly location: LocationInfo;
  readonly stateDetails: StateDetails | null;
  readonly lgaDetails: LgaDetails | null;
}

function findByRole(chain: ChainEntry[], role: string): ChainEntry | undefined {
  return chain.find((e) => e.role === role);
}

export function NarrativeView({
  chain,
  location,
  stateDetails,
  lgaDetails,
}: NarrativeViewProps) {
  const councilor = findByRole(chain, "councilor");
  const chairman = findByRole(chain, "lga_chairman");
  const governor = findByRole(chain, "governor");
  const mha = findByRole(chain, "mha");
  const hor = findByRole(chain, "representative") || findByRole(chain, "rep");
  const senator = findByRole(chain, "senator");

  const ward = location.wardName || "your ward";
  const lga = location.lgaName || "your LGA";
  const state = location.stateName || "your state";

  const councilorName = councilor?.official?.name;
  const chairmanName = chairman?.official?.name;
  const governorName = governor?.official?.name;
  const mhaName = mha?.official?.name;
  const horName = hor?.official?.name;
  const senatorName = senator?.official?.name;

  const lgaFaac = lgaDetails?.stats?.faac;
  const lgaFaacDate = (lgaDetails?.stats as any)?.faacDate || "YTD";
  const stateBudget = stateDetails?.stats?.budget;
  const stateFaac = stateDetails?.stats?.faac;
  const stateFaacDate = (stateDetails?.stats as any)?.faacDate || "YTD";
  const stateIgrRaw = stateDetails?.stats?.igr;
  const stateIgr =
    stateIgrRaw && stateIgrRaw !== "N/A" ? stateIgrRaw : undefined;
  const stateIgrStatLabel = (() => {
    const s = stateDetails?.stats;
    const y = s?.igrFiscalYear;
    const p = s?.igrPeriod;
    if (y != null && p) {
      if (p === "FY") return `IGR (FY ${y})`;
      return `IGR (${p} ${y})`;
    }
    if (y != null) return `IGR (${y})`;
    return "IGR";
  })();
  const domesticDebt = stateDetails?.economy?.domesticDebt;
  const externalDebt = stateDetails?.economy?.externalDebt;

  const locInfo = {
    stateCode: location.stateCode,
    stateName: location.stateName,
    lgaCode: location.lgaCode,
    lgaName: location.lgaName,
    wardCode: location.wardCode,
    wardName: location.wardName,
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-3 leading-tight font-heading">
          From Your Street to the Senate
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-heading">
          Who&apos;s Accountable to You?
        </p>
      </div>

      <div className="space-y-8 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
        {/* Opening */}
        <p className="first-letter:float-left first-letter:text-[5rem] first-letter:leading-[0.8] first-letter:pr-2 first-letter:font-bold first-letter:text-emerald-500">
          You live in {ward}, located within the {lga} Local Government Area
          of {state} State. The infrastructure you use every day—from the
          streetlights on your road to the primary healthcare center down the
          street—is managed by a chain of elected officials who are each
          responsible for public funds at different levels.
        </p>

        <p>
          The closest government official to you is your Ward Councilor.{" "}
          {councilorName ? (
            <>
              <strong className="text-emerald-700 dark:text-emerald-400">{councilorName}</strong> sits
              in the local council and is your first point of contact for everything that
              happens on the ground in {ward}.
            </>
          ) : (
            <>
              This person sits in the local council and is your first point of contact for
              everything that happens on the ground in {ward}.
            </>
          )}
        </p>

        {/* Councilor Card */}
        {councilor && (
          <NarrativeOfficialCard
            official={councilor.official}
            position={councilor.position}
            role={councilor.role}
            location={locInfo}
            scope={councilor.scope}
          />
        )}

        {/* Transition to Chairman */}
        <p>
          While your councilor advocates for your ward, the actual budget for{" "}
          {lga} LGA is managed by{" "}
          {chairmanName ? (
            <>
              your LGA Chairman,{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">{chairmanName}</strong>.
              The Chairman is the chief executive of the entire local government and
              decides how public money is allocated across all wards.
            </>
          ) : (
            <>
              your LGA Chairman. The Chairman is the chief executive of the
              entire local government and decides how public money is allocated
              across all wards.
            </>
          )}
        </p>

        {/* Chairman Card */}
        {chairman && (
          <NarrativeOfficialCard
            official={chairman.official}
            position={chairman.position}
            role={chairman.role}
            location={locInfo}
            scope={chairman.scope}
          />
        )}

        {/* LGA Financial Context */}
        {lgaFaac ? (
          <p>
            This year, {lga} LGA has received{" "}
            <strong className="text-emerald-700 dark:text-emerald-400">{lgaFaac}</strong>{" "}
            from the federal allocation (FAAC).{" "}
            {chairmanName || "The Chairman"} is tasked with using these
            funds—alongside locally generated revenue—to maintain local roads,
            manage waste, and fund primary education across all wards,
            including {ward}.
          </p>
        ) : (
          <p>
            The LGA receives federal allocations (FAAC) that are used to
            maintain local roads, manage waste, and fund primary education
            across all wards, including {ward}.
          </p>
        )}

        {/* LGA Stats */}
        <StatBlock
          columns={3}
          stats={[
            { label: "Est. Population", value: lgaDetails?.stats?.population },
            { label: `FAAC (${lgaFaacDate})`, value: lgaFaac, highlight: true },
            { label: "IGR", value: lgaDetails?.stats?.igr },
          ]}
        />

        {/* Transition to State */}
        <p>
          Now, zooming out to the state level.{" "}
          {state} State is run by the Governor, who manages{" "}
          {stateBudget ? (
            <>
              a massive <strong className="text-emerald-700 dark:text-emerald-400">{stateBudget}</strong>{" "}
              budget that funds
            </>
          ) : (
            "a budget that funds"
          )}{" "}
          state-wide infrastructure, secondary and tertiary education, major
          healthcare facilities, and security.
        </p>

        {/* Governor Card */}
        {governor && (
          <NarrativeOfficialCard
            official={governor.official}
            position={governor.position}
            role={governor.role}
            location={locInfo}
            scope={governor.scope}
          />
        )}

        {/* State Financial Context */}
        {(stateBudget || stateFaac || stateIgr) && (
          <p>
            {governorName ? (
              <>{governorName} manages</>
            ) : (
              <>The Governor manages</>
            )}{" "}
            {stateBudget && (
              <>
                a <strong className="text-emerald-700 dark:text-emerald-400">{stateBudget}</strong> budget
                for {state} State
              </>
            )}
            {stateFaac && (
              <>
                , funded by{" "}
                <strong className="text-emerald-700 dark:text-emerald-400">{stateFaac}</strong> in
                federal allocations
              </>
            )}
            {stateIgr && (
              <>
                {" "}and{" "}
                <strong className="text-emerald-700 dark:text-emerald-400">{stateIgr}</strong> in
                internally generated revenue
              </>
            )}
            .{" "}
            {domesticDebt && (
              <>
                {state} also carries{" "}
                <strong>{domesticDebt}</strong> in domestic debt
                {externalDebt && (
                  <>
                    {" "}and <strong>{externalDebt}</strong> in external debt
                  </>
                )}
                .
              </>
            )}
          </p>
        )}

        {/* State Stats */}
        <StatBlock
          columns={4}
          stats={[
            { label: "Budget", value: stateBudget },
            { label: `FAAC (${stateFaacDate})`, value: stateFaac, highlight: true },
            { label: stateIgrStatLabel, value: stateIgr },
            { label: "Domestic Debt", value: domesticDebt, negative: true },
          ]}
        />

        {/* Transition to Assembly */}
        <p>
          But the Governor doesn&apos;t spend all that money unchecked. The{" "}
          {state} State House of Assembly provides legislative oversight.{" "}
          {mhaName ? (
            <>
              <strong className="text-emerald-700 dark:text-emerald-400">{mhaName}</strong>{" "}
              represents {lga} in the State House of Assembly, ensuring
              that the LGA&apos;s interests are protected and providing legislative
              oversight over how the state budget is spent.
            </>
          ) : (
            <>
              Your representative in that House is responsible for scrutinizing
              the Governor&apos;s budget, making state laws, and ensuring{" "}
              {lga}&apos;s interests are protected at the state level.
            </>
          )}
        </p>

        {/* MHA Card */}
        {mha && (
          <NarrativeOfficialCard
            official={mha.official}
            position={mha.position}
            role={mha.role}
            location={locInfo}
            scope={mha.scope}
          />
        )}

        {/* Transition to HoR */}
        <p>
          Moving up to the federal level.{" "}
          {hor?.position?.constituency ? (
            <>
              {lga} is part of the {hor.position.constituency} Federal
              Constituency, which sends a representative to the House of
              Representatives in Abuja.
            </>
          ) : (
            <>
              {lga} sends a representative to the House of Representatives in
              Abuja.
            </>
          )}{" "}
          {horName ? (
            <>
              <strong className="text-emerald-700 dark:text-emerald-400">{horName}</strong>&apos;s
              job is to attract federal projects back to {lga}, vote on the
              national budget, and make federal laws that affect you.
            </>
          ) : (
            <>
              This person&apos;s job is to attract federal projects back to{" "}
              {lga}, vote on the national budget, and make federal laws that
              affect you.
            </>
          )}
        </p>

        {/* HoR Card */}
        {hor && (
          <NarrativeOfficialCard
            official={hor.official}
            position={hor.position}
            role={hor.role}
            location={locInfo}
            scope={hor.scope}
          />
        )}

        {/* Transition to Senator */}
        <p>
          Finally,{" "}
          {senator?.position?.constituency ? (
            <>
              {lga} falls under the {senator.position.constituency} Senatorial
              District.
            </>
          ) : (
            <>{state} has senators representing you in the upper chamber.</>
          )}{" "}
          {senatorName ? (
            <>
              <strong className="text-emerald-700 dark:text-emerald-400">{senatorName}</strong>{" "}
              sits in the Senate—the upper chamber of the National Assembly.
              They confirm ministerial appointments, vote on national
              legislation, and represent the broader interests of your
              senatorial district at the highest level of government.
            </>
          ) : (
            <>
              Your Senator sits in the upper chamber of the National Assembly,
              confirming ministerial appointments, voting on national legislation,
              and representing the broader interests of your senatorial district
              at the highest level of government.
            </>
          )}
        </p>

        {/* Senator Card */}
        {senator && (
          <NarrativeOfficialCard
            official={senator.official}
            position={senator.position}
            role={senator.role}
            location={locInfo}
            scope={senator.scope}
          />
        )}

        {/* Closing */}
        <p>
          These are the people managing the resources that shape your
          environment. If a road in {ward} is unpaved, or a local clinic
          lacks supplies, this chain of officials—from{" "}
          {councilorName || "your ward councilor"} all the way up to{" "}
          {senatorName || "your senator"}—are the ones accountable to you.
        </p>
      </div>
    </div>
  );
}
