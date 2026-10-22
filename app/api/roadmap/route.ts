export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Roadmap cards are stored one per row in a "roadmap" tab of the same Google
// Sheet the use cases live in. The tab is created on the first save; until
// then the board shows the defaults written in app/roadmap-board.tsx.

const SPREADSHEET_ID = '1YAzLS4CJ2bF6L1WLcYRTofEmmYZD3LraRvDjnTEsyLg';
const SHEET_TITLE = 'roadmap';
const COLUMNS = ['lane', 'horizon', 'product', 'title', 'detail', 'status', 'eta', 'dependency', 'outcome'] as const;

type RoadmapRow = Record<(typeof COLUMNS)[number], string>;

function getJWT() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  if (!privateKey || !clientEmail) throw new Error('Missing Google credentials');
  return new JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}

async function getDoc() {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, getJWT());
  await doc.loadInfo();
  return doc;
}

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_TITLE];
    if (!sheet) return NextResponse.json({ items: null });
    const rows = await sheet.getRows();
    if (rows.length === 0) return NextResponse.json({ items: null });
    const items = rows.map((row) => {
      const item = {} as RoadmapRow;
      COLUMNS.forEach((c) => { item[c] = row.get(c) ?? ''; });
      return item;
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load roadmap' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body?.items)) return NextResponse.json({ error: 'items must be an array' }, { status: 400 });

    const rows: RoadmapRow[] = body.items.map((raw: Record<string, unknown>) => {
      const row = {} as RoadmapRow;
      COLUMNS.forEach((c) => { row[c] = typeof raw[c] === 'string' ? (raw[c] as string) : ''; });
      return row;
    });

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_TITLE];
    if (!sheet) {
      sheet = await doc.addSheet({ title: SHEET_TITLE, headerValues: [...COLUMNS] });
    } else {
      await sheet.setHeaderRow([...COLUMNS]);
      await sheet.clearRows();
    }
    if (rows.length > 0) await sheet.addRows(rows);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save roadmap' }, { status: 500 });
  }
}
