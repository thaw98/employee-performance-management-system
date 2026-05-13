package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class FeedbackDraftSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 19;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("feedback draft schema migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        addReviewCycleColumnToFeedback(jdbc);
        createDraftTables(jdbc);
    }

    private void addReviewCycleColumnToFeedback(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "feedback")) {
            return;
        }
        if (!columnExists(jdbc, "feedback", "review_cycle_id")) {
            jdbc.execute("ALTER TABLE feedback ADD COLUMN review_cycle_id BIGINT NULL");
        }
        if (!indexExists(jdbc, "feedback", "idx_feedback_review_cycle")) {
            jdbc.execute("CREATE INDEX idx_feedback_review_cycle ON feedback(review_cycle_id)");
        }
    }

    private void createDraftTables(JdbcTemplate jdbc) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS feedback_draft (
                    draft_id BIGINT NOT NULL AUTO_INCREMENT,
                    evaluator_id BIGINT NOT NULL,
                    evaluatee_id BIGINT NOT NULL,
                    review_cycle_id BIGINT NOT NULL,
                    evaluator_role VARCHAR(20) NOT NULL,
                    anonymous BIT NULL,
                    created_at DATETIME(6) NOT NULL,
                    updated_at DATETIME(6) NOT NULL,
                    PRIMARY KEY (draft_id),
                    UNIQUE KEY uk_feedback_draft_cycle_pair_role (evaluator_id, evaluatee_id, review_cycle_id, evaluator_role),
                    INDEX idx_feedback_draft_cycle_end (review_cycle_id),
                    INDEX idx_feedback_draft_evaluator (evaluator_id)
                )
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS feedback_draft_detail (
                    detail_id BIGINT NOT NULL AUTO_INCREMENT,
                    draft_id BIGINT NOT NULL,
                    criteria_id BIGINT NOT NULL,
                    rating INT NULL,
                    comment TEXT NULL,
                    PRIMARY KEY (detail_id),
                    INDEX idx_feedback_draft_detail_draft (draft_id),
                    INDEX idx_feedback_draft_detail_criteria (criteria_id)
                )
                """);
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                        """,
                Boolean.class,
                tableName));
    }

    private static boolean columnExists(JdbcTemplate jdbc, String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                        """,
                Boolean.class,
                tableName,
                columnName));
    }

    private static boolean indexExists(JdbcTemplate jdbc, String tableName, String indexName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.STATISTICS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
                        """,
                Boolean.class,
                tableName,
                indexName));
    }
}
