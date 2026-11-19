const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const m = line.trim().match(/^([^=]+)=(.*)$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1].trim()] = v;
  }
});

const SHEET_ID = env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY
  ? env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;
const TAB_NAME = env.GOOGLE_SHEET_TAB_NAME || 'Boletas';

async function main() {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.error('❌ Error: Faltan credenciales en .env.local.');
    process.exit(1);
  }

  console.log(`🔄 Conectando a Google Sheet: ${SHEET_ID}...`);
  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📝 Generando encabezados y 1,000 boletas (000 al 999)...');
  const headers = [
    'Numero',
    'EstadoGeneral',
    'Nombre',
    'Telefono',
    'CuotasPagadas',
    'TotalAbonado',
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
    'UltimaRef',
    'UltimoDrive',
    'Notas',
    'ClaveSeguridad',
  ];

  const values = [headers];

  for (let i = 0; i < 1000; i++) {
    const num = i.toString().padStart(3, '0');
    // Generar un PIN hexadecimal aleatorio único de 4 cifras para cada boleta
    const pin = Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
    values.push([
      num, // Col A: Numero
      'Disponible', // Col B: EstadoGeneral
      '', // Col C: Nombre
      '', // Col D: Telefono
      0, // Col E: CuotasPagadas
      0, // Col F: TotalAbonado
      'Pendiente', // Col G: Ene
      'Pendiente', // Col H: Feb
      'Pendiente', // Col I: Mar
      'Pendiente', // Col J: Abr
      'Pendiente', // Col K: May
      'Pendiente', // Col L: Jun
      'Pendiente', // Col M: Jul
      'Pendiente', // Col N: Ago
      'Pendiente', // Col O: Sep
      'Pendiente', // Col P: Oct
      'Pendiente', // Col Q: Nov
      'Pendiente', // Col R: Dic
      '', // Col S: UltimaRef
      '', // Col T: UltimoDrive
      '', // Col U: Notas
      pin, // Col V: ClaveSeguridad (PIN único de 4 cifras)
    ]);
  }

  try {
    console.log(`📤 Escribiendo datos en la pestaña '${TAB_NAME}'!A1:V1001...`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${TAB_NAME}'!A1:V1001`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    console.log('✅ ¡Éxito total! 1,000 números (000 al 999) con las 12 cuotas configuradas en tu Google Sheet.');
  } catch (error) {
    console.error('❌ Error al escribir en Google Sheets:', error);
  }
}

main();
