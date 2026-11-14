import getpass
import json
import re
import urllib.error
import urllib.request


url = input('Render bot service URL (https://…onrender.com): ').strip()
if not re.fullmatch(r'https://[a-z0-9-]+\.onrender\.com/?', url):
    raise SystemExit('Enter the HTTPS URL of the Render bot service.')

token = getpass.getpass('BotFather token: ').strip()
if not re.fullmatch(r'[0-9]+:[A-Za-z0-9_-]+', token):
    raise SystemExit('Invalid BotFather token format.')

secret = getpass.getpass('TELEGRAM_WEBHOOK_SECRET from Render: ').strip()
if not re.fullmatch(r'[A-Za-z0-9_-]{1,256}', secret):
    raise SystemExit('Invalid Telegram webhook secret format.')

request = urllib.request.Request(
    f'https://api.telegram.org/bot{token}/setWebhook',
    data=json.dumps({
        'url': f'{url.rstrip("/")}/telegram',
        'secret_token': secret,
        'allowed_updates': ['message'],
    }).encode(),
    headers={'Content-Type': 'application/json'},
)

try:
    with urllib.request.urlopen(request, timeout=15) as response:
        result = json.load(response)
except urllib.error.HTTPError as error:
    raise SystemExit(f'Telegram rejected webhook registration (HTTP {error.code}).') from None
except urllib.error.URLError:
    raise SystemExit('Could not reach the Telegram Bot API.') from None

if not result.get('ok') or result.get('result') is not True:
    raise SystemExit('Telegram did not register the webhook.')

print('Webhook registered. Send /start to your bot in a private Telegram chat.')
