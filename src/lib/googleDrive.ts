import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';

const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink?: string;
  isDrive: boolean;
  fileName: string;
}

export function isGoogleDriveConfigured(): boolean {
  if (process.env.LOCAL_MODE === 'true' || process.env.FORCE_LOCAL_MODE === 'true') {
    return false;
  }
  return Boolean(CLIENT_EMAIL && PRIVATE_KEY && DRIVE_FOLDER_ID);
}

function getGoogleDriveClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Credenciales de Cuenta de Servicio no disponibles para Google Drive.');
  }

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Sube una imagen de comprobante a la carpeta configurada en Google Drive.
 * Si las credenciales de Drive no están completas, almacena localmente en public/uploads/
 * para garantizar funcionamiento sin interrupciones.
 */
export async function uploadReceiptToGoogleDrive(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  boletas: string[]
): Promise<DriveUploadResult> {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeNums = boletas.slice(0, 3).join('-');
  const fileName = `comprobante-${safeNums}-${Date.now()}.${ext}`;

  // Si Google Drive está completamente configurado
  if (isGoogleDriveConfigured()) {
    try {
      const drive = getGoogleDriveClient();

      const fileMetadata: { name: string; parents?: string[] } = {
        name: fileName,
      };

      if (DRIVE_FOLDER_ID) {
        fileMetadata.parents = [DRIVE_FOLDER_ID];
      }

      const media = {
        mimeType,
        body: Readable.from(buffer),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink',
      });

      const fileId = response.data.id || '';
      const webViewLink =
        response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

      // Otorgar permiso de lectura a cualquiera con el enlace (para que el organizador pueda abrirlo)
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permError) {
        console.warn('No se pudo establecer permiso público en Drive (podría estar restringido por dominio):', permError);
      }

      return {
        fileId,
        webViewLink,
        webContentLink: response.data.webContentLink || undefined,
        isDrive: true,
        fileName,
      };
    } catch (driveErr) {
      console.error('Error al subir a Google Drive, recurriendo a guardado local:', driveErr);
    }
  }

  // Fallback: Guardar en public/uploads/comprobantes
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);

  const localUrl = `/uploads/comprobantes/${fileName}`;
  return {
    fileId: `local-${Date.now()}`,
    webViewLink: localUrl,
    isDrive: false,
    fileName,
  };
}

