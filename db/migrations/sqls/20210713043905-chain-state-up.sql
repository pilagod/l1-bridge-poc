CREATE TABLE chain_state (
    id INTEGER PRIMARY KEY NOT NULL, -- chain id
    block_number UNSIGNED BIG INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
