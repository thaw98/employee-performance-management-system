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
public class QuestionBankOwnershipMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("question_bank ownership migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "question_bank")) {
            return;
        }
        addColumnIfMissing(jdbc, "owner_role_id", "BIGINT NULL");
        addColumnIfMissing(jdbc, "created_by_role_id", "BIGINT NULL");
        addColumnIfMissing(jdbc, "department_id", "BIGINT NULL");

        int ownerBackfilled = jdbc.update("UPDATE question_bank SET owner_role_id = 1 WHERE owner_role_id IS NULL");
        int creatorBackfilled = jdbc.update("UPDATE question_bank SET created_by_role_id = 1 WHERE created_by_role_id IS NULL");
        if (ownerBackfilled > 0 || creatorBackfilled > 0) {
            log.info(
                    "Backfilled question_bank HR ownership for {} owner row(s) and {} creator role row(s)",
                    ownerBackfilled,
                    creatorBackfilled);
        }

        if (!indexExists(jdbc, "question_bank", "idx_question_bank_scope")) {
            jdbc.execute("CREATE INDEX idx_question_bank_scope ON question_bank (owner_role_id, department_id, is_active)");
            log.info("Added question_bank scope index");
        }

        jdbc.execute("ALTER TABLE question_bank MODIFY owner_role_id BIGINT NOT NULL");
    }

    private void addColumnIfMissing(JdbcTemplate jdbc, String columnName, String definition) {
        if (!columnExists(jdbc, "question_bank", columnName)) {
            jdbc.execute("ALTER TABLE question_bank ADD COLUMN " + columnName + " " + definition);
            log.info("Added question_bank.{}", columnName);
        }
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
