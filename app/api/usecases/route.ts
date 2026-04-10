import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '1264Fl_2vzlBH-jI-xkHC2fCWJZNX0JJmzbPx8htgD7A';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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

    if (existing) {
      existing.set('name', body.name);
      existing.set('department', body.department);
      existing.set('stakeholder', body.stakeholder);
      existing.set('status', body.status);
      existing.set('horizon', body.horizon);
      existing.set('priority', body.priority);
      existing.set('description', body.description);
      existing.set('impact', body.impact);
      existing.set('notes', body.notes);
      existing.set('updated', body.updated);
      await existing.save();
    } else {
      await sheet.addRow({
        id: body.id,
        name: body.name,
        department: body.department,
        stakeholder: body.stakeholder,
        status: body.status,
        horizon: body.horizon,
        priority: body.priority,
        description: body.description,
        impact: body.impact,
        notes: body.notes,
        updated: body.updated,
      });
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
