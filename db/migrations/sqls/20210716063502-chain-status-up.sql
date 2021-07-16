CREATE TABLE chain_status (
    id INTEGER PRIMARY KEY, -- chain id
    block_number_synced TEXT NOT NULL DEFAULT '0'
);
