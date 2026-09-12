import { Type } from "@google/genai";

export enum SourceTier {
  TIER_1 = 1.0, // Official/Source data
  TIER_2 = 0.8, // Trusted Media/Analysis
  TIER_3 = 0.5, // General Web
}

export interface DataSource {
  name: string;
  category: string;
  tier: SourceTier;
  apiUrl?: string;
}

export const DATA_SOURCES: DataSource[] = [
  { name: "한국은행", category: "Economic", tier: SourceTier.TIER_1 },
  { name: "KDI", category: "Economic", tier: SourceTier.TIER_1 },
  { name: "OECD", category: "Economic", tier: SourceTier.TIER_1, apiUrl: "https://api.oecd.org" },
  { name: "IMF", category: "Economic", tier: SourceTier.TIER_1, apiUrl: "https://api.imf.org" },
  { name: "World Bank", category: "Economic", tier: SourceTier.TIER_1, apiUrl: "https://api.worldbank.org" },
  { name: "질병관리청", category: "Health", tier: SourceTier.TIER_1 },
  { name: "WHO", category: "Health", tier: SourceTier.TIER_1 },
  { name: "NASA", category: "Science", tier: SourceTier.TIER_1 },
  { name: "서울대 팩트체크", category: "FactCheck", tier: SourceTier.TIER_1 },
  { name: "Pew Research Center", category: "Social", tier: SourceTier.TIER_1 },
];
