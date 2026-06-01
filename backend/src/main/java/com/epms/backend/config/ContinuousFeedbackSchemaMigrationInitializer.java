package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ContinuousFeedbackSchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("continuous_feedback migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        if (tableExists(jdbc, "continuous_feedback")) {
            if (!columnExists(jdbc, "continuous_feedback", "scheduled_publish_at")) {
                jdbc.execute("ALTER TABLE continuous_feedback ADD COLUMN scheduled_publish_at DATETIME(6) NULL AFTER visibility_status");
                log.info("Added scheduled_publish_at column to continuous_feedback");
            }
            if (!columnExists(jdbc, "continuous_feedback", "scheduled_by_user_id")) {
                jdbc.execute("ALTER TABLE continuous_feedback ADD COLUMN scheduled_by_user_id BIGINT NULL AFTER scheduled_publish_at, ADD CONSTRAINT fk_cf_scheduled_by FOREIGN KEY (scheduled_by_user_id) REFERENCES user_account(user_id)");
                log.info("Added scheduled_by_user_id column to continuous_feedback");
            }
            if (!columnExists(jdbc, "continuous_feedback", "cancelled_at")) {
                jdbc.execute("ALTER TABLE continuous_feedback ADD COLUMN cancelled_at DATETIME(6) NULL AFTER scheduled_by_user_id");
                log.info("Added cancelled_at column to continuous_feedback");
            }
            if (!columnExists(jdbc, "continuous_feedback", "cancelled_by_user_id")) {
                jdbc.execute("ALTER TABLE continuous_feedback ADD COLUMN cancelled_by_user_id BIGINT NULL AFTER cancelled_at, ADD CONSTRAINT fk_cf_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES user_account(user_id)");
                log.info("Added cancelled_by_user_id column to continuous_feedback");
            }
            if (!columnExists(jdbc, "continuous_feedback", "scheduled_publish_at") && !indexExists(jdbc, "continuous_feedback", "idx_cf_scheduled_publish")) {
                jdbc.execute("CREATE INDEX idx_cf_scheduled_publish ON continuous_feedback (scheduled_publish_at, is_shared)");
                log.info("Created idx_cf_scheduled_publish index");
            }
        }

        if (!tableExists(jdbc, "continuous_feedback")) {
            jdbc.execute("""
                CREATE TABLE continuous_feedback (
                    feedback_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    employee_id BIGINT NOT NULL,
                    manager_id BIGINT NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    feedback_message TEXT NULL,
                    private_manager_note TEXT NULL,
                    visibility_status VARCHAR(20) NOT NULL DEFAULT 'PRIVATE_NOTE',
                    scheduled_publish_at DATETIME(6) NULL,
                    scheduled_by_user_id BIGINT NULL,
                    cancelled_at DATETIME(6) NULL,
                    cancelled_by_user_id BIGINT NULL,
                    is_shared BIT(1) NOT NULL DEFAULT 0,
                    shared_at DATETIME(6) NULL,
                    acknowledged BIT(1) NOT NULL DEFAULT 0,
                    acknowledged_at DATETIME(6) NULL,
                    is_supporting_evidence BIT(1) NOT NULL DEFAULT 1,
                    pip_suggested BIT(1) NOT NULL DEFAULT 0,
                    pip_suggested_at DATETIME(6) NULL,
                    created_at DATETIME(6) NOT NULL,
                    updated_at DATETIME(6) NULL,
                    created_by_user_id BIGINT NOT NULL,
                    updated_by_user_id BIGINT NULL,
                    CONSTRAINT fk_cf_employee FOREIGN KEY (employee_id) REFERENCES employee(employee_id),
                    CONSTRAINT fk_cf_manager FOREIGN KEY (manager_id) REFERENCES employee(manager_id),
                    CONSTRAINT fk_cf_created_by FOREIGN KEY (created_by_user_id) REFERENCES user_account(user_id),
                    CONSTRAINT fk_cf_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES user_account(user_id),
                    CONSTRAINT fk_cf_scheduled_by FOREIGN KEY (scheduled_by_user_id) REFERENCES user_account(user_id),
                    CONSTRAINT fk_cf_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES user_account(user_id),
                    INDEX idx_cf_employee_created (employee_id, created_at),
                    INDEX idx_cf_manager_created (manager_id, created_at),
                    INDEX idx_cf_category_created (category, created_at),
                    INDEX idx_cf_visibility_created (visibility_status, created_at),
                    INDEX idx_cf_scheduled_publish (scheduled_publish_at, is_shared)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
            log.info("Created continuous_feedback table");
        }

        if (!tableExists(jdbc, "continuous_feedback_action_item")) {
            jdbc.execute("""
                CREATE TABLE continuous_feedback_action_item (
                    action_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    feedback_id BIGINT NOT NULL,
                    description TEXT NOT NULL,
                    due_date DATE NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                    completed_at DATETIME(6) NULL,
                    created_at DATETIME(6) NOT NULL,
                    updated_at DATETIME(6) NULL,
                    CONSTRAINT fk_cfai_feedback FOREIGN KEY (feedback_id) REFERENCES continuous_feedback(feedback_id),
                    INDEX idx_cfai_feedback (feedback_id),
                    INDEX idx_cfai_status_due (status, due_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
            log.info("Created continuous_feedback_action_item table");
        }

        if (!tableExists(jdbc, "continuous_feedback_comment")) {
            jdbc.execute("""
                CREATE TABLE continuous_feedback_comment (
                    comment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    feedback_id BIGINT NOT NULL,
                    author_employee_id BIGINT NOT NULL,
                    comment_text TEXT NOT NULL,
                    comment_type VARCHAR(30) NOT NULL,
                    visible_to_employee BIT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME(6) NOT NULL,
                    CONSTRAINT fk_cfc_feedback FOREIGN KEY (feedback_id) REFERENCES continuous_feedback(feedback_id),
                    CONSTRAINT fk_cfc_author FOREIGN KEY (author_employee_id) REFERENCES employee(employee_id),
                    INDEX idx_cfc_feedback (feedback_id),
                    INDEX idx_cfc_author (author_employee_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
            log.info("Created continuous_feedback_comment table");
        }

        if (!tableExists(jdbc, "continuous_feedback_meeting_link")) {
            jdbc.execute("""
                CREATE TABLE continuous_feedback_meeting_link (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    feedback_id BIGINT NOT NULL,
                    meeting_id BIGINT NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    CONSTRAINT fk_cfml_feedback FOREIGN KEY (feedback_id) REFERENCES continuous_feedback(feedback_id),
                    CONSTRAINT fk_cfml_meeting FOREIGN KEY (meeting_id) REFERENCES meeting(meeting_id),
                    UNIQUE KEY uk_cfml_feedback_meeting (feedback_id, meeting_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
            log.info("Created continuous_feedback_meeting_link table");
        }

        if (!tableExists(jdbc, "continuous_feedback_pip_link")) {
            jdbc.execute("""
                CREATE TABLE continuous_feedback_pip_link (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    feedback_id BIGINT NOT NULL,
                    pip_id BIGINT NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    trigger_reason VARCHAR(255) NULL,
                    CONSTRAINT fk_cfpl_feedback FOREIGN KEY (feedback_id) REFERENCES continuous_feedback(feedback_id),
                    CONSTRAINT fk_cfpl_pip FOREIGN KEY (pip_id) REFERENCES performance_improvement_plan(pip_id),
                    UNIQUE KEY uk_cfpl_feedback_pip (feedback_id, pip_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
            log.info("Created continuous_feedback_pip_link table");
        }
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            Boolean.class, tableName));
    }

    private static boolean columnExists(JdbcTemplate jdbc, String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            Boolean.class, tableName, columnName));
    }

    private static boolean indexExists(JdbcTemplate jdbc, String tableName, String indexName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
            Boolean.class, tableName, indexName));
    }
}
