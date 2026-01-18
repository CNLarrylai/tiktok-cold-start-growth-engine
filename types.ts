
export interface BioComparison {
  bad: {
    text: string;
    avatar: string;
    confusionScore: number;
  };
  good: {
    text: string;
    avatar: string;
    authorityScore: number;
  } | null;
}

export interface ScriptHook {
  result: string;
  topic: string;
  action: string;
}

export interface LiveMilestone {
  minute: number;
  title: string;
  description: string;
  icon: string;
  type: 'hook' | 'value' | 'pivot' | 'conversion';
}
