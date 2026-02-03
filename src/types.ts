
export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  UI_SELECT = 'ui-select',
  CASCADE = 'cascade',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

export interface FormField {
  id: string;
  label: string;
  selector: string;
  type: FieldType;
  required: boolean;
  optionSelector?: string;
  cascadeSelectors?: string[];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  targetUrl: string;
  createdAt: number;
  fields: FormField[];
}

export interface DataRow {
  id: string;
  [key: string]: any;
}

export interface ComplianceResult {
  transcription: string;
  evaluation: {
    passed: boolean;
    summary: string;
    details: Array<{
      criterion: string;
      status: 'pass' | 'fail' | 'warning';
      observation: string;
    }>;
    overallScore: number; // 0-100
  };
}

export interface ProcessingState {
  status: 'idle' | 'extracting' | 'analyzing' | 'completed' | 'error';
  message: string;
  progress: number;
}

export interface Standard {
  id: string;
  criterion: string;
}
