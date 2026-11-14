import getpass
import json
import re
import shutil
import subprocess


curl = shutil.which('curl')
if not curl:
    raise SystemExit('Install curl before registering the webhook.')


url = input('Render bot service URL (https://…onrender.com): ').strip()
if not re.fullmatch(r'https://[a-z0-9-]+\.onrender\.com/?', url):
    raise SystemExit('Enter the HTTPS URL of the Render bot service.')

token = getpass.getpass('BotFather token: ').strip()
if not re.fullmatch(r'[0-9]+:[A-Za-z0-9_-]+', token):
    raise SystemExit('Invalid BotFather token format.')

secret = getpass.getpass('TELEGRAM_WEBHOOK_SECRET from Render: ').strip()
if not re.fullmatch(r'[A-Za-z0-9_-]{1,256}', secret):
    raise SystemExit('Invalid Telegram webhook secret format.')

# Pass credentials through stdin so they stay out of the process arguments.
payload = json.dumps({
    'url': f'{url.rstrip("/")}/telegram',
    'secret_token': secret,
    'allowed_updates': ['message'],
})
config = f'url = "https://api.telegram.org/bot{token}/setWebhook"\n'
config += f'data-binary = {json.dumps(payload)}\n'

reply = subprocess.run(
    [curl, '-q', '--silent', '--max-time', '20', '--proto', '=https',
     '--header', 'Content-Type: application/json', '--config', '-'],
    input=config, capture_output=True, text=True,
)
if reply.returncode:
    raise SystemExit(f'Could not reach the Telegram Bot API (curl exit {reply.returncode}).')

try:
    result = json.loads(reply.stdout)
except ValueError:
    raise SystemExit('Telegram returned an invalid API response.') from None

if not result.get('ok') or result.get('result') is not True:
    code = result.get('error_code')
    detail = f' (HTTP {code})' if isinstance(code, int) else ''
    raise SystemExit(f'Telegram did not register the webhook{detail}.')

print('Webhook registered. Send /start to your bot in a private Telegram chat.')
