export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// The AI tool tracker's "Access Log" tab (from AI Tool Tracker_Org.xlsx) lives
// in the same Google Sheet as the use cases. The header row is the first row
// with at least two filled cells, so the title and guidance rows above the
// table are skipped. Columns are returned as-is and interpreted by
// app/ai-tools/ai-tools-dashboard.tsx.

const SPREADSHEET_ID = '1YAzLS4CJ2bF6L1WLcYRTofEmmYZD3LraRvDjnTEsyLg';
const TAB_PATTERN = /^access\s*logs?$/i;

function getJWT() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  if (!privateKey || !clientEmail) throw new Error('Missing Google credentials');
  return new JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
}

export async function GET() {
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, getJWT());
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex.find((s) => TAB_PATTERN.test(s.title.trim()));
    if (!sheet) return NextResponse.json({ sheet: null, headers: [], rows: [] });

    const values: string[][] = (await sheet.getCellsInRange(`A1:${sheet.lastColumnLetter}${sheet.rowCount}`)) ?? [];
    const filled = (row: string[] = []) => row.filter((v) => String(v ?? '').trim() !== '').length;
    const headerIndex = values.findIndex((row) => filled(row) >= 2);
    if (headerIndex === -1) return NextResponse.json({ sheet: sheet.title, headers: [], rows: [] });

    const rawHeaders = values[headerIndex];
    const width = Math.max(rawHeaders.length, ...values.slice(headerIndex + 1).map((r) => r.length));
    const headers = Array.from({ length: width }, (_, i) => String(rawHeaders[i] ?? '').trim() || `Column ${i + 1}`);
    const rows = values
      .slice(headerIndex + 1)
      .filter((row) => filled(row) > 0)
      .map((row) => headers.map((_, i) => String(row[i] ?? '').trim()));

    return NextResponse.json({ sheet: sheet.title, headers, rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load AI tool tracker' }, { status: 500 });
  }
}
