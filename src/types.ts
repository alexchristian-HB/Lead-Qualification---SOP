export type EntityType = 'IDEA_STARTUP' | 'AGENCY_RESELLER' | 'FUNDED_STARTUP_SME' | 'ENTERPRISE';
export type GeoTier = 'TIER_A' | 'TIER_B' | 'TIER_C' | 'TIER_D';
export type ReadinessLevel = 'L0' | 'L1' | 'L2' | 'L3';
export type LeadTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

export interface AttachmentFile {
  fileName: string;
  fileType: string;
  size?: number;
  content: string; // Base64 or plain text
}

export interface InboundLeadInput {
  emailSubject?: string;
  senderEmail?: string;
  senderName?: string;
  rawText: string;
  attachments?: AttachmentFile[];
  baOverrideNotes?: string;
}

export interface Axis1Analysis {
  entityType: EntityType;
  score: number; // 1 - 4
  entityTypeName: string;
  endClientName?: string;
  isIntermediary: boolean;
  rationale: string;
}

export interface Axis2Analysis {
  payingTier: GeoTier;
  score: number; // 1 - 4
  contactCountry: string;
  payingEntityCountry: string;
  payingEntityRegion: string;
  mismatchNote: string;
  rationale: string;
}

export interface Axis3Analysis {
  readinessLevel: ReadinessLevel;
  score: number; // 1 - 4
  readinessDescription: string;
  providedMaterialsSummary: string[];
  rationale: string;
}

export interface RedFlagItem {
  flag: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING';
  actionRequired: string;
}

export interface ThinInfoQuestion {
  id: number;
  question: string;
  context: string;
  isAnsweredInEmail: boolean;
  detectedAnswer?: string;
}

export interface ApproachPlaybook {
  owner: string;
  sla: string;
  discoveryFormat: string;
  proposalModel: string;
}

export interface CRMLogData {
  entityType: string;
  geographyTier: string;
  readinessLevel: string;
  compositeScore: number;
  assignedTier: LeadTier;
  recommendedBAOwner: string;
  salesNotificationText: string;
}

export interface LeadQualificationReport {
  leadId: string;
  createdAt: string;
  leadTitle: string;
  prospectName: string;
  prospectCompany: string;
  
  // Axes
  axis1: Axis1Analysis;
  axis2: Axis2Analysis;
  axis3: Axis3Analysis;

  // Composite
  rawCompositeScore: number; // sum of axis scores (3 - 12)
  finalCompositeScore: number;
  assignedTier: LeadTier;
  tierDescription: string;

  // Overrides & Flags
  hasRedFlags: boolean;
  redFlags: RedFlagItem[];
  isTierOverriddenByRedFlag: boolean;
  originalCalculatedTier?: LeadTier;

  // Thin Info Protocol (Section 7)
  requiresThinInfoProtocol: boolean;
  thinInfoQuestions: ThinInfoQuestion[];

  // Playbook (Section 6)
  playbook: ApproachPlaybook;

  // Executive summary
  executiveSummary: string;
  keyHighlights: string[];
  recommendedNextSteps: string[];

  // CRM Logging format
  crmLog: CRMLogData;
}

export interface SavedLeadRecord {
  id: string;
  timestamp: string;
  input: InboundLeadInput;
  report: LeadQualificationReport;
}
