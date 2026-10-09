'use strict';
window.StudentBulk=(()=>{
 function prepare(raw,accounts=[],faculty=[],options={}){
  if(!Array.isArray(raw)||!raw.length||raw.length>500)throw new Error('Import 1–500 students per file.');
  const seen={registration:new Set(),email:new Set(),mobile:new Set()};
  return raw.map((source,i)=>{
   const row=Object.fromEntries(Object.entries(source).map(([k,v])=>[k.trim().toLowerCase(),String(v??'').trim()]));
   const x={row:i+2,registration:String(row.registration||row['register no']||row['register no.']||row['registration number']||'').toUpperCase(),name:row.name||'',email:String(row.email||row['mail id']||'').toLowerCase(),mobile:row.mobile||row['mobile number']||'',password:row.password||''};
   const fail=message=>{throw new Error('Excel row '+x.row+': '+message);};
   if(!x.registration||x.registration.length>40||!x.name||x.name.length>100||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)||x.email.length>150||! /^[6-9][0-9]{9}$/.test(x.mobile))fail('check registration, name, email and 10-digit mobile.');
   for(const key of Object.keys(seen)){if(seen[key].has(x[key]))fail('duplicate '+key+' within the file.');seen[key].add(x[key]);}
   const matches=accounts.filter(a=>a.registration===x.registration||a.email===x.email||a.mobile===x.mobile);
   if(matches.length){const a=matches[0];if(matches.length===1&&a.role==='student'&&a.registration===x.registration&&a.email===x.email&&a.mobile===x.mobile&&a.name===x.name){x.status='Existing — skipped';x.password='';return x;}fail('details conflict with an existing account.');}
   if(faculty.some(f=>f.email===x.email||f.mobile===x.mobile))fail('email or mobile belongs to faculty.');
   if(!x.password&&options.generatePassword){x.password=options.generatePassword();x.generatedPassword=true;}
   if(x.password.length<12||x.password.length>128)fail('new accounts need an initial password of 12–128 characters.');
   x.status='Ready';return x;
  });
 }
 async function run(rows,action,onProgress=()=>{},stopped=()=>false){
  for(const x of rows){
   if(stopped())break;
   if(x.status==='Created'||x.status==='Existing — skipped')continue;
   x.status='Creating';onProgress(x);
   try{await action('accountCreate',{role:'student',registration:x.registration,name:x.name,email:x.email,mobile:x.mobile,password:x.password,emailVerified:true});x.status='Created';x.password='';x.error='';}
   catch(e){x.status='Failed';x.error=e.message||'Account creation failed.';}
   onProgress(x);
  }
  return rows;
 }
 function generatePassword(provider){if(!provider?.getRandomValues)throw new Error('Secure password generation requires an HTTPS website.');const bytes=provider.getRandomValues(new Uint8Array(18)),chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';return 'Aa9!'+Array.from(bytes,b=>chars[b&63]).join('');}
 function workbookRows(XLSX,wb){for(const name of wb.SheetNames){const sheet=wb.Sheets[name],raw=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:true});if(!raw.length)continue;const keys=Object.keys(raw[0]).map(k=>k.trim().toLowerCase());if(!keys.some(k=>['registration','register no','register no.','registration number'].includes(k)))continue;for(const [key,cell] of Object.entries(sheet))if(!key.startsWith('!')&&cell.f)throw new Error('Use values, not formulas, in the student sheet.');return raw;}throw new Error('No student sheet found. Use registration/name/email/mobile, or REGISTER NO/NAME/EMAIL/MOBILE NUMBER.');}
 return {prepare,run,generatePassword,workbookRows};
})();
