import { DATA_SOURCES, DataSource } from "../constants";

export interface FactCheckResult {
  statement: string;
  verdict: "True" | "False" | "Uncertain";
  confidenceScore: number;
  reasoning: string;
  sources: { name: string; reliability: number }[];
}

export const resolveConflict = (
  claims: { sourceName: string; claim: string; value: number }[]
): FactCheckResult => {
  let totalWeight = 0;
  let weightedSum = 0;

  const sourcesUsed = claims.map((claim) => {
    const source = DATA_SOURCES.find((s) => s.name === claim.sourceName);
    const reliability = source ? source.tier : 0.5;
    totalWeight += reliability;
    weightedSum += claim.value * reliability;
    return { name: claim.sourceName, reliability };
  });

  const finalScore = weightedSum / totalWeight;

  return {
    statement: "Analyzed statement",
    verdict: finalScore > 0.7 ? "True" : finalScore < 0.3 ? "False" : "Uncertain",
    confidenceScore: finalScore,
    reasoning: `Based on ${sourcesUsed.length} sources with weighted reliability.`,
    sources: sourcesUsed,
  };
};
