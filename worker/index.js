import { jsonResponse, corsPreflightResponse } from './cors.js';
import { getSignupsByDate, getSignupsByRange, addSignup, removeSignup, getAllGear, upsertGear } from './db.js';

export default {
  async fetch(request, env) {
    const url      = new URL(request.url);
    const pathname = url.pathname;
    const method   = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return corsPreflightResponse();
    }

    try {
      // GET /api/signups/range?start=YYYY-MM-DD&end=YYYY-MM-DD
      if (pathname === '/api/signups/range' && method === 'GET') {
        const start = url.searchParams.get('start');
        const end   = url.searchParams.get('end');
        if (!start || !end) return jsonResponse({ error: 'Missing start or end param.' }, 400);
        const data = await getSignupsByRange(env.DB, start, end);
        return jsonResponse(data);
      }

      // /api/signups — GET, POST, DELETE
      if (pathname === '/api/signups') {
        switch (method) {
          case 'GET': {
            const date = url.searchParams.get('date');
            if (!date) return jsonResponse({ error: 'Missing date param.' }, 400);
            const names = await getSignupsByDate(env.DB, date);
            return jsonResponse(names);
          }

          case 'POST': {
            const body = await request.json();
            const { date, name } = body;
            if (!date || !name) return jsonResponse({ error: 'Missing date or name.' }, 400);
            const result = await addSignup(env.DB, date, name.trim());
            if (!result.success) return jsonResponse({ error: result.error }, 409);
            return jsonResponse({ success: true });
          }

          case 'DELETE': {
            const body = await request.json();
            const { date, name } = body;
            if (!date || !name) return jsonResponse({ error: 'Missing date or name.' }, 400);
            const result = await removeSignup(env.DB, date, name);
            return jsonResponse(result);
          }

          default:
            return jsonResponse({ error: 'Method not allowed.' }, 405);
        }
      }

      // /api/gear — GET, PUT
      if (pathname === '/api/gear') {
        switch (method) {
          case 'GET': {
            const data = await getAllGear(env.DB);
            return jsonResponse(data);
          }

          case 'PUT': {
            const body = await request.json();
            const { name, ...fields } = body;
            if (!name) return jsonResponse({ error: 'Missing name.' }, 400);
            const result = await upsertGear(env.DB, name.trim(), fields);
            return jsonResponse(result);
          }

          default:
            return jsonResponse({ error: 'Method not allowed.' }, 405);
        }
      }

      return jsonResponse({ error: 'Not found.' }, 404);

    } catch (err) {
      console.error(err);
      return jsonResponse({ error: 'Internal server error.' }, 500);
    }
  },
};
