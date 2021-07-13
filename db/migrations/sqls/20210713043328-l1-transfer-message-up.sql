CREATE TABLE l1_transfer_message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(16) NOT NULL, -- Deposit, Withdraw
    status VARCHAR(16) NOT NULL, -- Sent, Confirmed, Retryable, Done
    from_chain_id INTEGER NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    from_block_number TEXT NOT NULL,
    from_block_hash VARCHAR(66) NOT NULL, -- 0x...
    from_tx_hash VARCHAR(66) NOT NULL, -- 0x...
    to_chain_id INTEGER NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    to_block_number TEXT, -- filled after finalized
    to_block_hash VARCHAR(66), -- filled after finalized
    to_tx_hash VARCHAR(66), -- filled after finalized
    amount TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
