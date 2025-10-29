# Vercel Cron Jobs Setup

## Notifications Cleanup Cron

This project includes an automated cleanup job that runs daily to remove old read notifications.

### Configuration

1. **Schedule**: The cron is configured in `vercel.json` to run daily at 2 AM UTC:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/cleanup-notifications",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```

2. **Cron Schedule Format** (minute hour day month weekday):
   - `0 2 * * *` = Every day at 2:00 AM UTC
   - Examples:
     - `0 */6 * * *` = Every 6 hours
     - `0 0 * * 0` = Every Sunday at midnight
     - `*/30 * * * *` = Every 30 minutes

### Environment Variable Required

Add this to your Vercel project environment variables:

```bash
CRON_SECRET=your-random-secret-here
```

**To generate a secure secret:**
```bash
openssl rand -base64 32
```

### Setup Steps in Vercel:

1. **Add Environment Variable:**
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add:
     - Name: `CRON_SECRET`
     - Value: Your generated secret
     - Environment: Production, Preview, Development

2. **Enable Cron Jobs (Hobby/Pro Plan):**
   - Vercel Cron is available on **Hobby plan and above**
   - Free plan does not support cron jobs
   - Go to **Settings** → **Cron Jobs**
   - Your cron will auto-deploy with your next deployment

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Add notifications cleanup cron"
   git push
   ```

4. **Verify Cron is Running:**
   - Go to **Deployments** → Select your deployment
   - Click **Functions** tab
   - You should see `/api/cron/cleanup-notifications` listed
   - Check logs after 2 AM UTC to see cleanup running

### What the Cron Does:

- Runs daily at 2 AM UTC
- Deletes notifications where:
  - `is_read = true`
  - `read_at < NOW() - 24 hours`
- Keeps database clean and performant
- Logs how many notifications were deleted

### Testing Locally:

You can test the cron endpoint locally:

```bash
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/cleanup-notifications
```

### Manual Trigger (Production):

You can also trigger it manually from Vercel dashboard:
1. Go to **Cron Jobs** tab
2. Find your cron
3. Click **Trigger** button

---

## Alternative: If Not on Hobby+ Plan

If you're on the Free plan, you can use external services:

### Option 1: Cron-job.org
1. Create free account at https://cron-job.org
2. Add new cron job pointing to: `https://yoursite.vercel.app/api/cron/cleanup-notifications`
3. Set schedule: Daily at 2 AM
4. Add header: `Authorization: Bearer your-cron-secret`

### Option 2: EasyCron
Similar setup at https://www.easycron.com

### Option 3: GitHub Actions
Create `.github/workflows/cleanup.yml`:
```yaml
name: Cleanup Notifications
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yoursite.vercel.app/api/cron/cleanup-notifications
```

Add `CRON_SECRET` to your GitHub repository secrets.
