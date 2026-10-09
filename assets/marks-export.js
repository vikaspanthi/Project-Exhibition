'use strict';
window.MarksExport=(()=>{
 function build(XLSX,state){
  const wb=XLSX.utils.book_new(),limits={1:15,2:25,3:60},students=(state.accounts||[]).filter(a=>a.role==='student'),faculty=id=>state.faculty.find(f=>f.id===id);
  const ordered=[...state.groups.flatMap(g=>students.filter(a=>a.group_id===g.id).sort((a,b)=>a.registration.localeCompare(b.registration))),...students.filter(a=>!state.groups.some(g=>g.id===a.group_id)).sort((a,b)=>a.registration.localeCompare(b.registration))];
  const grid=[['','','','','','','','','','','Review maximum: 15','Review maximum: 25','Review maximum: 60','','Review total','After deduction','Final / 100',''],['S.No.','Group No.','Enrollment No.','Name','Mail ID','Mob. No.','Supervisor','Reviewer 1','Reviewer 2','HARDCOPY','Review 1 (15)','Review 2 (25)','Review-III (60)','Deduction','Total','Total','Final marks (100)','Comments']];
  const metadata=[];
  ordered.forEach((a,i)=>{const g=state.groups.find(g=>g.id===a.group_id),marks=[1,2,3].map(r=>state.marks.find(m=>m.student_id===a.id&&Number(m.round_no)===r)),legacy=marks.some((m,j)=>m&&Number(m.maximum)!==limits[j+1]),complete=marks.every(Boolean)&&!legacy,total=complete?marks.reduce((n,m)=>n+Number(m.score),0):'',status=!g?'No group':legacy?'Needs coordinator correction: old review scale':complete?'Complete':'Pending reviews '+marks.map((m,j)=>m?'':j+1).filter(Boolean).join(', ');
   grid.push([i+1,g?.name||'',a.registration,a.name,a.email,String(a.mobile||''),faculty(g?.supervisor)?.name||'',faculty(g?.reviewer1)?.name||'',faculty(g?.reviewer2)?.name||'','',...marks.map((m,j)=>m&&Number(m.maximum)===limits[j+1]?Number(m.score):null),0,null,null,null,status+(marks.some(m=>m?.feedback)?' · '+marks.map((m,j)=>m?.feedback?'R'+(j+1)+': '+m.feedback:'').filter(Boolean).join('; '):'')]);
   metadata.push({row:i+3,group:g?.id,total});
  });
  const sheet=XLSX.utils.aoa_to_sheet(grid);sheet['!cols']=[7,20,20,32,42,18,28,28,28,14,18,18,18,14,14,14,20,52].map(wch=>({wch}));sheet['!rows']=[{hpt:24},{hpt:34}];sheet['!autofilter']={ref:'A2:R'+Math.max(grid.length,2)};sheet['!merges']=[];
  for(const x of metadata){const r=x.row,valid=`AND(COUNT(K${r}:M${r})=3,K${r}>=0,K${r}<=15,L${r}>=0,L${r}<=25,M${r}>=0,M${r}<=60)`;for(const [col,formula] of [['O',`IF(${valid},SUM(K${r}:M${r}),"")`],['P',`IF(O${r}="","",IF(AND(ISNUMBER(N${r}),N${r}>=0,N${r}<=O${r}),O${r}-N${r},""))`],['Q',`IF(P${r}="","",ROUND(P${r},2))`]])sheet[col+r]={t:x.total===''?'str':'n',v:x.total,f:formula,z:'0.00'};}
  for(let start=0;start<metadata.length;){let end=start;while(end+1<metadata.length&&metadata[start].group&&metadata[end+1].group===metadata[start].group)end++;if(end>start)for(const c of [1,6,7,8,9]){sheet['!merges'].push({s:{r:start+2,c},e:{r:end+2,c}});for(let k=start+1;k<=end;k++)delete sheet[XLSX.utils.encode_cell({r:k+2,c})];}start=end+1;}
  XLSX.utils.book_append_sheet(wb,sheet,'Marks');
  const roster=XLSX.utils.aoa_to_sheet([['REGISTER NO','NAME','MOBILE NUMBER','EMAIL'],...students.map(a=>[a.registration,a.name,String(a.mobile||''),a.email])]);roster['!cols']=[20,32,20,42].map(wch=>({wch}));XLSX.utils.book_append_sheet(wb,roster,'Students list');
  const groups=XLSX.utils.aoa_to_sheet([['Team No.','Member 1','Member 2','Member 3','Member 4','Member 5','Supervisor','Reviewer 1','Reviewer 2'],...state.groups.map(g=>{const members=students.filter(a=>a.group_id===g.id).sort((a,b)=>a.registration.localeCompare(b.registration));return [g.name,...Array.from({length:5},(_,i)=>members[i]?.registration||''),faculty(g.supervisor)?.name||'',faculty(g.reviewer1)?.name||'',faculty(g.reviewer2)?.name||''];})]);groups['!cols']=[20,20,20,20,20,20,28,28,28].map(wch=>({wch}));XLSX.utils.book_append_sheet(wb,groups,'Groups');
  const records=state.marks.map(m=>{const a=students.find(a=>a.id===m.student_id);return {Registration:a?.registration||'',Review:m.round_no,'Saved score':m.score,'Saved maximum':m.maximum,Feedback:m.feedback||'','Updated by':(state.accounts||[]).find(a=>a.id===m.updated_by)?.email||'','Updated at':m.updated_at||''};});XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(records),'Review Records');
  return wb;
 }
 return {build};
})();
