import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";

export function makeClient(stringSession = "") {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  return new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });
}

export { Api, StringSession };