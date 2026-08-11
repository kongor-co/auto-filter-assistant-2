import type { AppState, ControlMapping, ExecutionResult, PickerResult } from '../domain/types';
export type ExtensionMessage =
  | {type:'GET_CONTEXT'}
  | {type:'APPLY_NOW'}
  | {type:'AUTO_APPLY'}
  | {type:'STATE_UPDATED';state:AppState}
  | {type:'EXECUTION_COMPLETE';result:ExecutionResult}
  | {type:'START_PICKER'}
  | {type:'START_PICKER_IN_PAGE'}
  | {type:'PICKER_SELECTED';result:PickerResult}
  | {type:'PICKER_CANCELLED'}
  | {type:'CLEAR_PICKER'}
  | {type:'TEST_CONTROL';control:ControlMapping}
  | {type:'SET_AUTOMATIC';shopId:string;enabled:boolean;origins:string[]}
  | {type:'IMPORT_STATE';raw:unknown};
