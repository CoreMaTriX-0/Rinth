export interface Component {
  name: string;
  purpose: string;
}

export interface InstructionStep {
  step: number;
  description: string;
}

export interface ProjectCode {
  language: string;
  content: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EngineeringProject {
  id?: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  estimatedCost: string;
  tags: string[];
  components: Component[];
  instructions: InstructionStep[];
  code: ProjectCode;
  imageUrl?: string;
  buyingLinks?: GroundingSource[];
  author?: string;
  timestamp?: number;
}

export enum LoadingState {
  IDLE = 'idle',
  GENERATING_PLAN = 'generating_plan',
  GENERATING_IMAGE = 'generating_image',
  FINDING_LINKS = 'finding_links',
  COMPLETED = 'completed',
  ERROR = 'error'
}
