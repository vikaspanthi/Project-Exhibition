'use strict';
window.StudentBulk=(()=>{
 function prepare(raw,accounts=[],faculty=[]){
  if(!Array.isArray(raw)||!raw.length||raw.length>200)throw new Error('Import 1–200 students per file.');
  const seen={registration:new Set(),email:new Set(),mobile:new Set()};
  return raw.map((source,i)=>{
   const row=Object.fromEntries(Object.entries(source).map(([k,v])=>[k.trim().toLowerCase(),String(v??'').trim()]));
   const x={row:i+2,registration:String(row.registration||'').toUpperCase(),name:row.name||'',email:String(row.email||'').toLowerCase(),mobile:row.mobile||'',password:row.password||''};
   const fail=message=>{throw new Error('Excel row '+x.row+': '+message);};
   if(!x.registration||x.registration.length>40||!x.name||x.name.length>100||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)||x.email.length>150||! /^[6-9][0-9]{9}$/.test(x.mobile))fail('check registration, name, email and 10-digit mobile.');
   for(const key of Object.keys(seen)){if(seen[key].has(x[key]))fail('duplicate '+key+' within the file.');seen[key].add(x[key]);}
   const matches=accounts.filter(a=>a.registration===x.registration||a.email===x.email||a.mobile===x.mobile);
   if(matches.length){const a=matches[0];if(matches.length===1&&a.role==='student'&&a.registration===x.registration&&a.email===x.email&&a.mobile===x.mobile&&a.name===x.name){x.status='Existing — skipped';x.password='';return x;}fail('details conflict with an existing account.');}
   if(faculty.some(f=>f.email===x.email||f.mobile===x.mobile))fail('email or mobile belongs to faculty.');
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
 return {prepare,run};
})();
