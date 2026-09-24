// Local-only UI QA: complete Quiz 1 without production records or messages.
if (process.env.MARLO_LOCAL_QA !== '1') throw new Error('Requires MARLO_LOCAL_QA=1');
process.env.NOTION_TOKEN = 'qa-only';
process.env.NOTION_PARTICIPANTS_DB = 'qa-db';
process.env.APPS_SCRIPT_URL = 'https://qa.invalid/sheet';
process.env.APPS_SCRIPT_SECRET = 'qa-only';
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url === 'https://api.notion.com/v1/databases/qa-db/query') return Response.json({results: []});
  if (url === 'https://api.notion.com/v1/pages' && init?.method === 'POST') return Response.json({id: 'qa-participant'});
  if (url === 'https://qa.invalid/sheet') return Response.json({ok: true});
  if (/^https?:/.test(url) && !['GET', 'HEAD'].includes(init?.method || 'GET')) throw new Error('QA blocked unexpected write');
  return original(input, init);
};
