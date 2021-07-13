CREATE TABLE l1_transfer_message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(16) NOT NULL, -- Deposit, Withdraw
    status VARCHAR(16) NOT NULL, -- Sent, Confirmed, Retryable, Done
    from_chain_id INTEGER NOT NULL,
    from_block_number UNSIGNED BIG INT NOT NULL,
    from_block_hash VARCHAR(66) NOT NULL, -- 0x...
    from_tx_hash VARCHAR(66) NOT NULL, -- 0x...
    from_address VARCHAR(64) NOT NULL,
    to_chain_id INTEGER NOT NULL,
    to_block_number UNSIGNED BIG INT, -- filled after finalized
    to_block_hash VARCHAR(66), -- filled after finalized
    to_tx_hash VARCHAR(66), -- filled after finalized
    to_address VARCHAR(64) NOT NULL,
    amount TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
