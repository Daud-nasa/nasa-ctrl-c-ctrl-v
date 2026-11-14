import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!webhookSecret || !/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) {
  throw new Error('Set TELEGRAM_WEBHOOK_SECRET to a valid Telegram webhook secret.');
}

const expectedSecret = Buffer.from(webhookSecret);
const miniAppUrl = 'https://lunar-shift.onrender.com';
const messages = {
  start: '🌙 Welcome to Lunar Shift, cadet!\n\nYour mission is to run an outpost at the Moon’s south pole. Manage power, grow food, and keep your crew safe through six shifts.\n\nTap Play Lunar Shift to open the trainer. Use /help for a quick briefing.',
  help: '🛰️ Mission briefing\n\n☀️ Charge the battery while the solar panels have sunlight.\n🔋 In shadow, use stored power to keep life support running.\n🌱 Power the greenhouse to grow food.\n🛡️ When a radiation alert appears, consider moving the crew into shelter.\n\nTap Play Lunar Shift to open the trainer.',
};

createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200).end('OK');
    return;
  }

  if (request.method !== 'POST' || request.url !== '/telegram') {
    response.writeHead(404).end();
    return;
  }

  const providedSecret = Buffer.from(request.headers['x-telegram-bot-api-secret-token'] ?? '');
  if (providedSecret.length !== expectedSecret.length || !timingSafeEqual(providedSecret, expectedSecret)) {
    response.writeHead(403).end();
    return;
  }

  let update;
  try {
    const chunks = [];
    let bodySize = 0;
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      bodySize += chunk.length;
      if (bodySize > 64 * 1024) {
        response.writeHead(413, { Connection: 'close' }).end();
        return;
      }
      chunks.push(chunk);
    }
    update = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    response.writeHead(400).end();
    return;
  }

  const message = update?.message;
  const command = typeof message?.text === 'string'
    ? /^\/(start|help)(?:@[a-z0-9_]+)?(?=\s|$)/i.exec(message.text)?.[1].toLowerCase()
    : undefined;

  if (message?.chat?.type !== 'private' || !Number.isSafeInteger(message.chat.id) || !command) {
    response.writeHead(200).end();
    return;
  }

  response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
    method: 'sendMessage',
    chat_id: message.chat.id,
    text: messages[command],
    reply_markup: {
      inline_keyboard: [[{ text: 'Play Lunar Shift', web_app: { url: miniAppUrl } }]],
    },
  }));
}).listen(process.env.PORT ?? 3000, '0.0.0.0');
