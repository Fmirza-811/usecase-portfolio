export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1YAzLS4CJ2bF6L1WLcYRTofEmmYZD3LraRvDjnTEsyLg';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

function getJWT() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  if (!privateKey || !clientEmail) throw new Error('Missing Google credentials');
  return new JWT({ email: clientEmail, key: privateKey, scopes: SCOPES });
}

async function getSheet() {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, getJWT());
  await doc.loadInfo();
  return doc.sheetsByIndex[0];
}

export async function GET() {
  try {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const data = rows.map((row) => ({
      id: row.get('id'),
      name: row.get('name'),
      department: row.get('department'),
      stakeholder: row.get('stakeholder'),
      status: row.get('status'),
      horizon: row.get('horizon'),
      priority: row.get('priority'),
      description: row.get('description'),
      impact: row.get('impact'),
      notes: row.get('notes'),
      updated: row.get('updated'),
      start_date: row.get('start_date'),
      end_date: row.get('end_date'),
      value_amount: row.get('value_amount'),
      brd_url: row.get('brd_url'),
      score: row.get('score'),
    }));
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const existing = rows.find((r) => r.get('id') === body.id);

    const fields = ['name','department','stakeholder','status','horizon','priority','description','impact','notes','updated','start_date','end_date','value_amount','brd_url','score'];

    if (existing) {
      fields.forEach((f) => existing.set(f, body[f] ?? ''));
      await existing.save();
    } else {
      const newRow: Record<string, string> = { id: body.id };
      fields.forEach((f) => { newRow[f] = body[f] ?? ''; });
      await sheet.addRow(newRow);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);
    if (row) await row.delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// BRD upload endpoint
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const useCaseId = formData.get('id') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const jwt = getJWT();
    const drive = google.drive({ version: 'v3', auth: jwt });

    const buffer = Buffer.from(await file.arrayBuffer());

    const driveRes = await drive.files.create({
      requestBody: {
        name: `BRD_${useCaseId}_${file.name}`,
        mimeType: file.type,
      },
      media: {
        mimeType: file.type,
        body: require('stream').Readable.from(buffer),
      },
      fields: 'id, webViewLink',
    });

    const fileId = driveRes.data.id!;

    // Make file publicly viewable
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    const url = driveRes.data.webViewLink!;

    // Update sheet with BRD url
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === useCaseId);
    if (row) {
      row.set('brd_url', url);
      await row.save();
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to upload BRD' }, { status: 500 });
  }
}
