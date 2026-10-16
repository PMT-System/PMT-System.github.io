import {config} from './config.js';
let session; let refreshing;
try { session=JSON.parse(sessionStorage.getItem('pmt.session')||'null'); } catch { session=null; }
export const currentSession=()=>session;
export function saveSession(value){session=value; if(value)sessionStorage.setItem('pmt.session',JSON.stringify(value));else sessionStorage.removeItem('pmt.session');}
async function parse(response){const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=null;}if(!response.ok)throw Object.assign(Error(data?.message||data?.error_description||data?.error||`Request failed (${response.status}).`),{status:response.status});return data;}
export async function auth(path,body){return parse(await fetch(config.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify(body)}));}
export async function token(){
 if(!session)throw Error('Please sign in.');
 if(session.expires_at*1000<Date.now()+60000){if(!refreshing)refreshing=auth('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(v=>{saveSession(v);return v;}).catch(e=>{saveSession(null);window.dispatchEvent(new Event('pmt:expired'));throw e;}).finally(()=>refreshing=null);await refreshing;}
 return session.access_token;
}
export async function request(path,{method='GET',body,headers={}}={}){return parse(await fetch(config.url+path,{method,headers:{apikey:config.key,Authorization:'Bearer '+await token(),'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)}));}
export const list=(table,query='')=>request('/rest/v1/'+table+'?'+query);
export const insert=(table,data)=>request('/rest/v1/'+table,{method:'POST',body:data,headers:{Prefer:'return=representation'}});
export const update=(table,id,data)=>request('/rest/v1/'+table+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:data,headers:{Prefer:'return=representation'}});
export const rpc=(name,args={})=>request('/rest/v1/rpc/'+name,{method:'POST',body:args});
export const edge=(action,args={})=>request('/functions/v1/pmt-service',{method:'POST',body:{action,...args}});
export async function upload(bucket,path,file,onProgress){
 const access=await token();return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',config.url+'/storage/v1/object/'+bucket+'/'+path);xhr.setRequestHeader('apikey',config.key);xhr.setRequestHeader('Authorization','Bearer '+access);xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.upload.onprogress=e=>onProgress?.(e.lengthComputable?Math.round(e.loaded/e.total*100):0);xhr.onerror=()=>reject(Error('Upload interrupted. Your report is saved; retry the attachment.'));xhr.onload=()=>xhr.status<300?resolve():reject(Error('Upload failed: '+xhr.responseText));xhr.send(file);});
}
export async function signedFile(bucket,path){const result=await request('/storage/v1/object/sign/'+bucket+'/'+path,{method:'POST',body:{expiresIn:60}});return config.url+'/storage/v1'+result.signedURL;}
export async function signOut(){try{await request('/auth/v1/logout',{method:'POST'});}finally{saveSession(null);}}
