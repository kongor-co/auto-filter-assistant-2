import type { AppState, ExecutionResult } from '../domain/types';
export type ExtensionMessage = { type: 'GET_CONTEXT' } | { type: 'APPLY_NOW' } | { type: 'STATE_UPDATED'; state: AppState } | { type: 'EXECUTION_COMPLETE'; result: ExecutionResult };
