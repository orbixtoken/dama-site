// Gera payload BR Code (PIX copia-e-cola) com valor + txid.
const MERCHANT_NAME = (import.meta.env.VITE_PIX_MERCHANT_NAME || "DAMA BET").toUpperCase();
const MERCHANT_CITY = (import.meta.env.VITE_PIX_MERCHANT_CITY || "SAO PAULO").toUpperCase();

function emv(id, value) {
  const v = String(value ?? "");
  const len = v.length.toString().padStart(2, "0");
  return `${id}${len}${v}`;
}
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function makePixPayload({
  pixKey,
  amount,
  txid,
  name = MERCHANT_NAME,
  city = MERCHANT_CITY,
  dynamic = false, // se quiser alternar 11(dinâmico) x 12(estático)
}) {
  const gui = emv("00", "br.gov.bcb.pix");
  const key = emv("01", pixKey);
  const add = emv("02", txid);
  const mai = emv("26", gui + key + add);

  const body =
    emv("00", "01") +
    emv("01", dynamic ? "11" : "12") +
    mai +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", Number(amount).toFixed(2)) +
    emv("58", "BR") +
    emv("59", name.slice(0, 25)) +
    emv("60", city.slice(0, 15)) +
    emv("62", emv("05", txid));

  const crc = crc16(body + "6304");
  return body + "6304" + crc;
}
