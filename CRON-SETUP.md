# Setting Up External Cron Job for Reminders

Since Vercel cron jobs require a Pro plan, you need to use an external cron service to automatically process reminders.

## Your Reminder Endpoint

**URL:** `https://notifyx-pied.vercel.app/api/v1/reminders/process`  
**Method:** `POST`  
**Authentication:** Bearer token (use your `CRON_SECRET` from `.env`)

**Your CRON_SECRET:** `1c8df665fee0f9f65d4ea3b97509b022d61caa076c0d1de9d5880508d775c9ec`

## Setup Instructions

### Option 1: cron-job.org (Free & Easy)

1. Go to [https://cron-job.org](https://cron-job.org)
2. Sign up for a free account
3. Click "Create cronjob"
4. Configure:
   - **Title:** Reminder Processor
   - **Address:** `https://notifyx-pied.vercel.app/api/v1/reminders/process`
   - **Schedule:** Every 5 minutes (`*/5 * * * *`)
   - **Request method:** POST
   - **Request headers:** 
     - Key: `Authorization`
     - Value: `Bearer 1c8df665fee0f9f65d4ea3b97509b022d61caa076c0d1de9d5880508d775c9ec`
5. Click "Create cronjob"

### Option 2: EasyCron (Free tier available)

1. Go to [https://www.easycron.com](https://www.easycron.com)
2. Sign up for free account
3. Create a new cron job:
   - **URL:** `https://notifyx-pied.vercel.app/api/v1/reminders/process`
   - **Schedule:** Every 5 minutes
   - **HTTP Method:** POST
   - **HTTP Headers:** `Authorization: Bearer 1c8df665fee0f9f65d4ea3b97509b022d61caa076c0d1de9d5880508d775c9ec`
4. Save and activate

### Option 3: GitHub Actions (Free)

Create `.github/workflows/reminders.yml`:

```yaml
name: Process Reminders

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process Reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://notifyx-pied.vercel.app/api/v1/reminders/process
```

Add `CRON_SECRET` to GitHub Secrets.

### Option 4: UptimeRobot (Free - 50 monitors)

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Create a new monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://notifyx-pied.vercel.app/api/v1/reminders/process`
   - **Method:** POST
   - **Headers:** `Authorization: Bearer 1c8df665fee0f9f65d4ea3b97509b022d61caa076c0d1de9d5880508d775c9ec`
   - **Interval:** 5 minutes

## Important Notes

1. **Security:** Always use your `CRON_SECRET` in the Authorization header
2. **Rate Limits:** Most free services allow 1-5 minute intervals
3. **Testing:** Test manually first:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.vercel.app/api/v1/reminders/process
   ```
4. **Monitoring:** Check your cron service logs to ensure it's running
5. **Backup:** Consider setting up multiple cron services for redundancy

## Manual Testing

You can also manually trigger reminders for testing:

```bash
curl -X POST \
  -H "Authorization: Bearer 1c8df665fee0f9f65d4ea3b97509b022d61caa076c0d1de9d5880508d775c9ec" \
  https://notifyx-pied.vercel.app/api/v1/reminders/process
```

## Recommended Schedule

- **Every 5 minutes** (`*/5 * * * *`) - Recommended for timely reminders
- **Every 10 minutes** (`*/10 * * * *`) - Less frequent, still good
- **Every hour** (`0 * * * *`) - Only if you don't need precise timing

Choose based on your reminder needs and cron service limits.
