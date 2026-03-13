import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

function getToken(): string {
  const token = process.env.GOOGLE_ACCESS_TOKEN;
  if (!token) throw new Error('GOOGLE_ACCESS_TOKEN is not set in environment variables.');
  return token;
}

async function gcalRequest(method: string, path: string, body?: object) {
  const res = await fetch(`${GCAL_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || 'Google Calendar API error');
  return data;
}

export function registerCalendarTools(server: McpServer) {

  // List events
  server.tool(
    'calendar_list_events',
    'List upcoming Google Calendar events',
    {
      maxResults: z.number().optional().default(10),
      timeMin: z.string().optional().describe('ISO 8601 start date (defaults to now)'),
      query: z.string().optional().describe('Search query'),
    },
    async ({ maxResults, timeMin, query }) => {
      try {
        const params = new URLSearchParams({
          maxResults: String(maxResults),
          timeMin: timeMin || new Date().toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          ...(query && { q: query }),
        });
        const data = await gcalRequest('GET', `/calendars/primary/events?${params}`);
        const events = (data.items || []).map((e: any) => ({
          id: e.id,
          title: e.summary,
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          meet: e.hangoutLink,
          attendees: e.attendees?.map((a: any) => a.email),
        }));
        return { content: [{ type: 'text' as const, text: JSON.stringify(events, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
      }
    }
  );

  // Create meeting
  server.tool(
    'calendar_create_meeting',
    'Create a Google Calendar event with an optional Google Meet link',
    {
      title: z.string(),
      startTime: z.string().describe('ISO 8601 datetime'),
      endTime: z.string().describe('ISO 8601 datetime'),
      attendees: z.array(z.string()).optional().describe('List of email addresses'),
      description: z.string().optional(),
      addMeetLink: z.boolean().optional().default(true),
      timeZone: z.string().optional().default('Asia/Kolkata'),
    },
    async ({ title, startTime, endTime, attendees, description, addMeetLink, timeZone }) => {
      try {
        const event: any = {
          summary: title,
          description,
          start: { dateTime: startTime, timeZone },
          end: { dateTime: endTime, timeZone },
          attendees: attendees?.map(email => ({ email })),
        };
        if (addMeetLink) {
          event.conferenceData = {
            createRequest: { requestId: Date.now().toString(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
          };
        }
        const data = await gcalRequest('POST', '/calendars/primary/events?conferenceDataVersion=1', event);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            id: data.id,
            title: data.summary,
            start: data.start?.dateTime,
            end: data.end?.dateTime,
            meetLink: data.hangoutLink,
            calendarLink: data.htmlLink,
          }, null, 2) }],
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
      }
    }
  );

  // Delete event
  server.tool(
    'calendar_delete_event',
    'Delete a Google Calendar event by ID',
    {
      eventId: z.string(),
      confirm: z.boolean().describe('Must be true to proceed'),
    },
    async ({ eventId, confirm }) => {
      if (!confirm) return { content: [{ type: 'text' as const, text: 'Deletion cancelled. Pass confirm=true to proceed.' }] };
      try {
        await gcalRequest('DELETE', `/calendars/primary/events/${eventId}`);
        return { content: [{ type: 'text' as const, text: `Event '${eventId}' deleted successfully.` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
      }
    }
  );
}
