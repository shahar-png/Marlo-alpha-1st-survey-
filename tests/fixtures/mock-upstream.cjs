// Local-only QA preload. It cannot be enabled by a public route or query parameter.
// Start via npm run build && npm run qa:serve; no production credentials are used, and all external writes are blocked.
if(process.env.MARLO_LOCAL_QA!=='1')throw new Error('QA preload requires MARLO_LOCAL_QA=1');
process.env.NOTION_TOKEN='qa-only';process.env.NOTION_PARTICIPANTS_DB='qa-db';process.env.APPS_SCRIPT_URL='https://qa.invalid/sheet';process.env.APPS_SCRIPT_SECRET='qa-only';
const original=globalThis.fetch;
const id='00000000-0000-0000-0000-000000000001';
const page=email=>({id,properties:{Name:{type:'title',title:[{plain_text:'Alex Example'}]},'First name':{type:'rich_text',rich_text:[{plain_text:'Alex'}]},Email:{type:'email',email},'Age band':{type:'select',select:{name:'35–44'}},'ICP bucket':{type:'select',select:{name:'Optimizer'}},Supplements:{type:'multi_select',multi_select:[{name:'Magnesium'},{name:'Vitamin D'}]},Frequency:{type:'select',select:{name:'Most days'}},'Survey 2 done':{type:'date',date:email.startsWith('done@')?{start:'2026-09-23'}:null}}});
let submissionCount=0;
globalThis.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input),method=init?.method||'GET';
 if(url.startsWith('https://api.notion.com/')){
  if(method==='PATCH'){submissionCount++;if(submissionCount===1)return Response.json({error:'qa-retry'},{status:500});return Response.json({});}
  if(url.includes('/query')){const body=JSON.parse(init.body),email=body.filter.email.equals;return email.startsWith('error@')?Response.json({},{status:500}):Response.json({results:email.startsWith('missing@')?[]:[page(email)]});}
  return Response.json(page('alex@example.com'));
 }
 if(url==='https://qa.invalid/sheet'){const body=JSON.parse(init.body);require('fs').writeFileSync('/tmp/marlo-survey2-qa-last-submit.json',JSON.stringify(body,null,2));return Response.json({ok:true,sheetId:'qa-sheet',gid:1,rowIndex:2});}
 if(method!=='GET'&&method!=='HEAD'&&/^https?:/.test(url))throw new Error('QA blocked unexpected network write');
 return original(input,init);
};
