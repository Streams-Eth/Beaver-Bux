# BBUX Presale Analytics Dashboard Setup

## Overview

The BBUX presale now has a **hybrid tracking system**:

1. **Smart Contract (Source of Truth)**: On-chain data from Base network
2. **Supabase Database (Backup & Analytics)**: Redundant tracking for faster queries and historical data

## Dashboard Features

- **Real-time contract stats**: ETH raised, BBUX sold, contributor count
- **Database backup tracking**: Redundant purchase logs
- **Recent purchases**: Last 10 transactions with buyer/amount/time
- **Auto-refresh**: Manual refresh button to update stats
- **BaseScan link**: Direct link to contract explorer

## Setup Instructions

### 1. Create Supabase Table

Run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- See: docs/supabase_presale_table.sql
CREATE TABLE IF NOT EXISTS presale_purchases (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  eth_amount TEXT NOT NULL,
  bbux_amount TEXT NOT NULL,
  network INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presale_purchases_wallet ON presale_purchases(wallet_address);
CREATE INDEX IF NOT EXISTS idx_presale_purchases_created ON presale_purchases(created_at DESC);
```

### 2. Environment Variables

Make sure these are set in your `.env.local` AND your hosting platform (Netlify/Vercel):

```bash
# Supabase (already configured for PayPal claims)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Network (Base mainnet)
NEXT_PUBLIC_NETWORK=base
NEXT_PUBLIC_BASE_PRESALE=0xF479063E290E85e1470a11821128392F6063790B
```

### 3. Access the Dashboard

**Local Development:**
```
http://localhost:3001/admin/dashboard
```

**Production:**
```
https://beaverbux.ca/admin/dashboard
```

### 4. How It Works

#### On-Chain Stats (Primary)
- Queries Base network directly via JSON-RPC
- Functions: `ethRaised()`, `tokensSold()`, `contributorCount()`
- Events: `TokensPurchased` for recent activity
- **100% accurate** - blockchain is immutable

#### Database Stats (Backup)
- Every purchase automatically logged to Supabase
- Provides redundancy if RPC is down
- Enables complex queries and analytics
- Faster than querying blockchain events

#### Purchase Flow
1. User clicks "Buy BBUX" in presale widget
2. Transaction sent to Base network
3. On success:
   - Transaction hash stored in localStorage
   - **NEW**: Purchase tracked in Supabase via `/api/admin/track-purchase`
4. Smart contract emits `TokensPurchased` event
5. Dashboard shows both contract and database stats

## API Endpoints

### GET /api/admin/stats
Returns database-tracked totals:
```json
{
  "totalPurchases": 5,
  "totalETH": "0.002500",
  "totalBBUX": "2173.91",
  "recentPurchases": [...]
}
```

### POST /api/admin/track-purchase
Logs purchase to database (auto-called by presale widget):
```json
{
  "tx_hash": "0x...",
  "wallet_address": "0x...",
  "eth_amount": "0.0005",
  "bbux_amount": "434.78",
  "network": 8453
}
```

## Security Considerations

- Dashboard is **public** by default - consider adding authentication
- Supabase RLS policies allow:
  - Public read access (for dashboard)
  - Service role full access (for API)
  - Authenticated inserts (for tracking)
- Smart contract data is public on blockchain anyway

## Monitoring & Maintenance

**Daily checks:**
- Compare contract stats vs database stats (should match)
- Check for failed tracking attempts in logs
- Monitor Base network RPC health

**Monthly:**
- Review contributor growth trends
- Calculate average purchase size
- Track stage progression toward 5 ETH cap

**If stats don't match:**
1. Contract is source of truth - use those numbers
2. Check Supabase logs for failed inserts
3. Manually query contract events to backfill database

## Troubleshooting

**Dashboard shows "Failed to load contract stats":**
- Check Base RPC is accessible: https://mainnet.base.org
- Verify contract address: 0xF479063E290E85e1470a11821128392F6063790B
- Test with BaseScan: https://basescan.org/address/0xF479063E290E85e1470a11821128392F6063790B

**Database stats show 0:**
- Check Supabase environment variables are set
- Run SQL migration: `docs/supabase_presale_table.sql`
- Verify table exists: `SELECT * FROM presale_purchases;`

**Recent purchases not showing:**
- Events may not be indexed yet (wait ~1 minute)
- Increase block range in contract query (currently 10,000 blocks)
- Check BaseScan for transaction confirmation

## Future Enhancements

- [ ] Authentication for admin dashboard
- [ ] Email alerts for large purchases (>1 ETH)
- [ ] Historical charts and graphs
- [ ] Export to CSV for accounting
- [ ] Webhook notifications for new purchases
- [ ] Individual contributor lookup by wallet
- [ ] Stage progression indicators

## Related Files

- Dashboard: `app/admin/dashboard/page.tsx`
- Stats API: `app/api/admin/stats/route.ts`
- Tracking API: `app/api/admin/track-purchase/route.ts`
- Widget tracking: `components/presale-widget.tsx` (lines 600-615)
- SQL migration: `docs/supabase_presale_table.sql`
