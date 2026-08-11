import type { AttributeType } from './types';
export const ATTRIBUTE_TYPES:{value:AttributeType;label:string;description:string}[]=[
  {value:'text',label:'Text',description:'One free-text value'},
  {value:'number',label:'Number',description:'One numeric value'},
  {value:'singleSelect',label:'Single select',description:'One choice from your own options'},
  {value:'multiSelect',label:'Multi select',description:'Several values entered by you'},
  {value:'boolean',label:'Yes / no',description:'An enabled or disabled preference'}
];
