import { api } from '../../shared/services/api';
export type FunctionalCase={id:string;testDescription:string;acceptanceCriteria:string;status:string;result?:string|null;observations?:string|null;requirement:{code:string;name:string}};
export type FunctionalRecord={id:string;project:string;analystName:string;performedByName:string;startedAt:string;status:string;cases:FunctionalCase[];total:number;performed:number;pending:number;successful:number;failed:number;performedPercentage:number;successfulPercentage:number};
export const functionalTestsApi={
 list:async()=> (await api.get<FunctionalRecord[]>('/test-records')).data,
 get:async(id:string)=> (await api.get<FunctionalRecord>(`/test-records/${id}`)).data,
 create:async(v:Record<string,string>)=>(await api.post('/test-records',v)).data,
 addCase:async(id:string,v:Record<string,string>)=>(await api.post(`/test-records/${id}/cases`,v)).data,
 execute:async(id:string,v:Record<string,string>)=>(await api.post(`/test-cases/${id}/execute`,v)).data,
 evidence:async(id:string,documentId:string)=>(await api.post(`/test-cases/${id}/evidence`,{documentId})).data,
};
