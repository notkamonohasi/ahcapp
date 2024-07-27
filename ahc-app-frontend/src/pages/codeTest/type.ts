export interface Commit {
  time: string;
  success: boolean;
  codePath: string;
  message: string;
}

export interface ContestParams {
  isInteractive: boolean;
  timeLimit: number;
  testSize: number;
}
