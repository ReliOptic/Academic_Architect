export interface Session {
  id: number | string;
  date: string;
  archive: string;
  level: string;
  title: string;
  desc: string;
  tags: string[];
  bloom?: string;
  active?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';
  message: string;
  source?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface Engine {
  id: string;
  name: string;
  icon: any;
  description: string;
  cost?: string;
  badge?: string;
  recommended?: boolean;
}
