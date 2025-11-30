-- Create presale_purchases table for tracking BBUX presale transactions
-- This provides redundant tracking alongside smart contract data

CREATE TABLE IF NOT EXISTS presale_purchases (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  eth_amount TEXT NOT NULL,
  bbux_amount TEXT NOT NULL,
  network INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_presale_purchases_wallet ON presale_purchases(wallet_address);
CREATE INDEX IF NOT EXISTS idx_presale_purchases_created ON presale_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presale_purchases_tx_hash ON presale_purchases(tx_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE presale_purchases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can do everything" ON presale_purchases
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create policy to allow public read access (for dashboard)
CREATE POLICY "Anyone can read purchases" ON presale_purchases
  FOR SELECT
  USING (true);

-- Create policy to allow inserts from authenticated sources
CREATE POLICY "Authenticated can insert" ON presale_purchases
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE presale_purchases IS 'Tracks BBUX presale purchases for analytics and redundancy. Smart contract is source of truth.';
COMMENT ON COLUMN presale_purchases.tx_hash IS 'Blockchain transaction hash (unique)';
COMMENT ON COLUMN presale_purchases.wallet_address IS 'Buyer wallet address';
COMMENT ON COLUMN presale_purchases.eth_amount IS 'ETH amount as string to preserve precision';
COMMENT ON COLUMN presale_purchases.bbux_amount IS 'BBUX tokens purchased as string';
COMMENT ON COLUMN presale_purchases.network IS 'Chain ID (8453 for Base)';
