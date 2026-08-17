// SAMPLE / DUMMY DATA — illustrative only.

export const quarterlyTrend = [
  { period: "Q1 FY25", revenue: 30.2, pbt: 19.8, cir: 61.4, netMargin: 41.2 },
  { period: "Q2 FY25", revenue: 37.9, pbt: 23.1, cir: 57.8, netMargin: 43.9 },
  { period: "Q3 FY25", revenue: 38.6, pbt: 24.4, cir: 55.1, netMargin: 45.7 },
  { period: "Q4 FY25", revenue: 48.1, pbt: 33.6, cir: 49.6, netMargin: 49.8 },
  { period: "Q1 FY26", revenue: 39.8, pbt: 27.5, cir: 44.2, netMargin: 52.1 },
];

export const actualVsBudget = [
  { item: "Revenue / Total Income", actual: 45.2, budget: 40.6, py: 42.0 },
  { item: "Staff Cost", actual: -14.9, budget: -15.6, py: -14.1 },
  { item: "Admin & Operating Cost", actual: -2.1, budget: -2.5, py: -2.0 },
  { item: "Total Cost", actual: -19.1, budget: -20.3, py: -18.4 },
  { item: "Profit Before Tax", actual: 27.5, budget: 21.6, py: 24.9 },
  { item: "Net Profit Margin (%)", actual: 52.1, budget: 46.3, py: 49.5 },
];

export const varianceCommentary = {
  revenue: "Higher fee income from managed-entity mandates, partly offset by softer advisory revenue.",
  staffCost: "Lower than budget mainly on headcount phasing — 3 approved positions still in recruitment.",
  adminCost: "Computer system and corporate communication spend tracked below budget for the quarter.",
  pbt: "PBT ahead of budget on the back of stronger fee income and disciplined cost control.",
  outlook: "Management expects the favourable variance to normalise by Q3 as planned hiring completes.",
};

export const balanceSheet = {
  assets: [
    { label: "Cash & Equivalents", value: 41.2 },
    { label: "Fixed Income Investments", value: 612.4 },
    { label: "Receivables & Others", value: 22.8 },
    { label: "Fixed Assets (Net)", value: 13.1 },
  ],
  liabilities: [
    { label: "Trade & Other Payables", value: 21.7 },
    { label: "Deferred Revenue", value: 3.4 },
    { label: "Other Liabilities", value: 9.8 },
  ],
  shareholdersFund: 654.6,
  priorShareholdersFund: 631.0,
  trend: [
    { period: "Q1 FY25", equity: 560.1, liabilities: 38.9 },
    { period: "Q2 FY25", equity: 578.4, liabilities: 36.2 },
    { period: "Q3 FY25", equity: 601.7, liabilities: 34.0 },
    { period: "Q4 FY25", equity: 631.0, liabilities: 33.5 },
    { period: "Q1 FY26", equity: 654.6, liabilities: 34.9 },
  ],
};

export const relatedPartyTransactions = [
  { txn: "Management fee — SJPP", party: "SJPP", nature: "Management Fee Income", value: 31.9, quarter: "Q1 FY26", basis: "Approved Basis", approved: true },
  { txn: "Management fee — SJKP", party: "SJKP", nature: "Management Fee Income", value: 3.1, quarter: "Q1 FY26", basis: "Approved Basis", approved: true },
  { txn: "Management fee — DanaInfra", party: "DanaInfra", nature: "Management Fee Income", value: 3.0, quarter: "Q1 FY26", basis: "Approved Basis", approved: true },
  { txn: "Advisory / outsourcing", party: "DanaHarta", nature: "Professional Services", value: 0.1, quarter: "Q1 FY26", basis: "Market Rate", approved: true },
  { txn: "Management fee — GovCo", party: "GovCo", nature: "Management Fee Income", value: 0.1, quarter: "Q1 FY26", basis: "Approved Basis", approved: false },
];
