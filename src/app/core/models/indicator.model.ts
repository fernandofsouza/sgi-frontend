export type ReferenceRange = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export interface RelevanceScaleLabel {
  value: number;
  label: string;
}

export interface RelevanceCriteria {
  id: string;
  name: string;
  description: string;
  active: boolean;
  scaleLabels: RelevanceScaleLabel[];
}

export interface RelevanceAssessment {
  criterionId: string;
  score: number;
}

export interface AchievementScaleLabel {
  value: number;
  label: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatarUrl?: string;
  active: boolean;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  targetValue: number;
  currentValue: number;
  unit: string;
}

export interface CriteriaUpdate {
  criteriaId: string;
  value: number;
}

export interface CheckIn {
  id: string;
  indicatorId: string;
  checkDate: string;
  progress: number;
  notes: string;
  author: TeamMember;
  criteriaUpdates: CriteriaUpdate[];
  createdAt: string;
}

export interface IndicatorSummary {
  id: string;
  seqId: number;
  title: string;
  pdgId: string;
  creationStatus: string;
  progressStatus: string;
  progress: number;
  targetDate: string;
  parentId: string | null;
  referenceYear: number;
  referenceRange: ReferenceRange;
  referenceLabel: string;
  assignees: TeamMember[];
  checkInCount: number;
  updatedAt: string;
}

export interface IndicatorDetail extends IndicatorSummary {
  description: string;
  childrenIds: string[];
  editor: TeamMember | null;
  validator: TeamMember | null;
  observation: string;
  criteria: EvaluationCriteria[];
  achievementScale: AchievementScaleLabel[];
  checkIns: CheckIn[];
  relevanceAssessments: RelevanceAssessment[];
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IndicatorFilter {
  year?: number;
  range?: ReferenceRange | 'all';
  label?: string;
  creationStatus?: string;
  progressStatus?: string;
  page?: number;
  size?: number;
}

export const REFERENCE_RANGES: { value: ReferenceRange; label: string }[] = [
  { value: 'mensal',     label: 'Mensal' },
  { value: 'bimestral',  label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
];

export function getReferenceOptions(range: ReferenceRange): string[] {
  switch (range) {
    case 'mensal':     return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    case 'bimestral':  return ['1B','2B','3B','4B','5B','6B'];
    case 'trimestral': return ['1T','2T','3T','4T'];
    case 'semestral':  return ['1S','2S'];
    case 'anual':      return ['Anual'];
  }
}

export const DEFAULT_ACHIEVEMENT_SCALE: AchievementScaleLabel[] = [
  { value: 1, label: 'Insuficiente' },
  { value: 2, label: 'Abaixo do esperado' },
  { value: 3, label: 'Dentro do esperado' },
  { value: 4, label: 'Acima do esperado' },
  { value: 5, label: 'Excepcional' },
];
