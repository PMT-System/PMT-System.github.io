export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function csv(rows, columns = [...new Set(rows.flatMap(Object.keys))]) {
  const cell = v => {
    let s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[\s]*[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"','""') + '"';
  };
  return '\uFEFF' + [columns.map(cell).join(','), ...rows.map(r => columns.map(k => cell(r[k])).join(','))].join('\r\n');
}
export function dateTime(value) { return value ? new Intl.DateTimeFormat('en-PK',{timeZone:'Asia/Karachi',dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) + ' PKT' : '—'; }
export function bytes(value) { return value == null ? '—' : (Number(value)/1024/1024).toFixed(1)+' MB'; }
export async function validateAPK(file) {
  if (!file || !/\.apk$/i.test(file.name) || file.size < 22 || file.size > 200*1024*1024) throw Error('Select a valid APK, maximum 200 MB.');
  const head = new Uint8Array(await file.slice(0,4).arrayBuffer());
  if (head[0]!==80 || head[1]!==75 || head[2]!==3 || head[3]!==4) throw Error('APK must be a ZIP-format Android package.');
  const tail = new Uint8Array(await file.slice(Math.max(0,file.size-65557)).arrayBuffer());
  const view = new DataView(tail.buffer); let eocd=-1;
  for(let i=tail.length-22;i>=0;i--) if(view.getUint32(i,true)===0x06054b50 && i+22+view.getUint16(i+20,true)===tail.length){eocd=i;break;}
  if(eocd<0) throw Error('APK directory is missing or corrupt.');
  const size=view.getUint32(eocd+12,true), offset=view.getUint32(eocd+16,true);
  if(size>16*1024*1024 || offset+size>file.size) throw Error('Unsupported APK directory.');
  const cd=new Uint8Array(await file.slice(offset,offset+size).arrayBuffer()); const dv=new DataView(cd.buffer); let manifest=false;
  for(let p=0;p+46<=cd.length;) { if(dv.getUint32(p,true)!==0x02014b50) throw Error('Corrupt APK directory.'); const n=dv.getUint16(p+28,true), extra=dv.getUint16(p+30,true), comment=dv.getUint16(p+32,true); if(p+46+n+extra+comment>cd.length) throw Error('Corrupt APK entry.'); const name=new TextDecoder().decode(cd.slice(p+46,p+46+n)); if(name==='AndroidManifest.xml')manifest=true; p+=46+n+extra+comment; }
  if(!manifest)throw Error('AndroidManifest.xml is missing.');
}
export async function sha256(file) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export async function allPages(fetchPage, size=500) { const result=[]; for(let offset=0;;offset+=size){ const page=await fetchPage(offset,size);result.push(...page);if(page.length<size)return result; } }
