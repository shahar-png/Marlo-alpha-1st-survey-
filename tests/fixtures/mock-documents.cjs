// Local-only document QA. No production credentials or external writes.
if(process.env.MARLO_LOCAL_QA!=='1') throw new Error('QA preload requires MARLO_LOCAL_QA=1');
process.env.NOTION_TOKEN='qa-only';process.env.NOTION_PARTICIPANTS_DB='qa-db';process.env.APPS_SCRIPT_URL='https://qa.invalid/sheet';process.env.APPS_SCRIPT_SECRET='qa-only';
const original=globalThis.fetch, fs=require('node:fs');
const id='00000000-0000-0000-0000-000000000001';
const signed=new Set();let email='alex@example.com',failed=false;
const page=()=>({id,properties:{Name:{type:'title',title:[{plain_text:'Alex Example'}]},'First name':{type:'rich_text',rich_text:[{plain_text:'Alex'}]},Email:{type:'email',email},'Waiver signed':{type:'date',date:signed.has(email)||email.startsWith('signed@')?{start:'2026-09-23'}:null}}});
globalThis.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input),method=init?.method||'GET';
 if(url.startsWith('https://api.notion.com/')){
  if(url.endsWith('/query')){email=JSON.parse(init.body).filter.email.equals;return email.startsWith('error@')?Response.json({},{status:500}):Response.json({results:email.startsWith('missing@')?[]:[page()]});}
  if(url.endsWith('/file_uploads'))return Response.json({id:'qa-upload'});
  if(url.endsWith('/send')){const blob=init.body.get('file');fs.writeFileSync('/tmp/marlo-document-ui-qa.pdf',Buffer.from(await blob.arrayBuffer()));return Response.json({});}
  if(method==='PATCH'){if(email.startsWith('retry@')&&!failed){failed=true;return Response.json({},{status:500});}signed.add(email);return Response.json({});}
  return Response.json(page());
 }
 if(url==='https://qa.invalid/sheet')return Response.json({ok:true});
 if(method!=='GET'&&method!=='HEAD'&&/^https?:/.test(url))throw new Error('QA blocked unexpected network write');
 return original(input,init);
};
