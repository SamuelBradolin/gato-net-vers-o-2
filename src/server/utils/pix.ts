/**
 * Gato Net - Pix Standards-Compliant EMV BR Code Generator
 * Conforme Manual de Padrões para Iniciação do Pix - Banco Central do Brasil
 */

/**
 * Calculates CRC16 CCITT (0xFFFF, 0x1021)
 */
export function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Normalizes text to ASCII removing accents and punctuation for EMV compliance
 */
export function normalizeEMVText(text: string, maxLength: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .slice(0, maxLength);
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadParams {
  key: string;
  recipientName: string;
  city: string;
  amount: number;
  txId?: string;
  description?: string;
}

/**
 * Generates official EMV Pix Copia e Cola string
 */
export function generatePixCopyPaste(params: PixPayloadParams): string {
  const { key, recipientName, city, amount, txId } = params;

  // Format 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Merchant Account Info (Tag 26)
  const gui = emvField('00', 'br.gov.bcb.pix');
  const keyField = emvField('01', key.trim());
  const merchantAccountInfo = emvField('26', `${gui}${keyField}`);

  // Additional Data (Tag 62) with TxId / Reference
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const additionalDataField = emvField('62', emvField('05', cleanTxId));

  // Build Payload
  let payload = '';
  payload += emvField('00', '01'); // Payload Format Indicator
  payload += emvField('01', '12'); // Point of Initiation (12 = dynamic/defined amount)
  payload += merchantAccountInfo;
  payload += emvField('52', '0000'); // Merchant Category Code
  payload += emvField('53', '986');  // Transaction Currency (986 = BRL)
  payload += emvField('54', formattedAmount); // Transaction Amount
  payload += emvField('58', 'BR');   // Country Code
  payload += emvField('59', normalizeEMVText(recipientName || 'GATO NET', 25)); // Merchant Name
  payload += emvField('60', normalizeEMVText(city || 'SAO PAULO', 15));         // Merchant City
  payload += additionalDataField;

  // Add Tag 63 (CRC16) header and compute CRC
  const payloadForCrc = `${payload}6304`;
  const crc = calculateCRC16(payloadForCrc);

  return `${payloadForCrc}${crc}`;
}
