ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS additional_comments VARCHAR(1000) NULL;

ALTER TABLE feedback_draft
    ADD COLUMN IF NOT EXISTS additional_comments VARCHAR(1000) NULL;
