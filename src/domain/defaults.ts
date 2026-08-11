import type { AppState, UserAttribute } from './types';

export const DEFAULT_ATTRIBUTES: UserAttribute[] = [
  { code:'shoe_size_eu',label:'EU shoe size',type:'number',enabled:true,value:'',options:[],builtIn:true },
  { code:'clothing_size',label:'Clothing size',type:'text',enabled:false,value:'',options:[],builtIn:true },
  { code:'preferred_colours',label:'Preferred colours',type:'multiSelect',enabled:true,value:[],options:[],builtIn:true },
  { code:'preferred_brands',label:'Preferred brands',type:'multiSelect',enabled:false,value:[],options:[],builtIn:true },
  { code:'preferred_materials',label:'Preferred materials',type:'multiSelect',enabled:false,value:[],options:[],builtIn:true }
];
export const DEFAULT_STATE: AppState = {
  schemaVersion:4,onboarded:false,globalEnabled:true,
  profile:{name:'',attributes:structuredClone(DEFAULT_ATTRIBUTES),sort:{enabled:true,value:'PRICE_ASC'}},
  shops:{zalando:{enabled:true,automatic:false,sortEnabled:true}},
  personalMappings:[],pendingPicker:null,lastResult:null
};
