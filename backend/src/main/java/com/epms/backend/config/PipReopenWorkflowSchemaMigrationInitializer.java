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
public class PipReopenWorkflowSchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("PIP reopen workflow schema migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "performance_improvement_plan")) {
            return;
        }

        addColumnIfMissing(jdbc, "original_end_date", "DATE NULL");
        addColumnIfMissing(jdbc, "auto_close_date", "DATE NULL");
        addColumnIfMissing(jdbc, "extended_end_date", "DATE NULL");
        addColumnIfMissing(jdbc, "final_close_date", "DATE NULL");
        addColumnIfMissing(jdbc, "reopen_decision", "VARCHAR(20) NULL");
        addColumnIfMissing(jdbc, "reopen_decision_date", "DATETIME(6) NULL");

        jdbc.execute("""
                UPDATE performance_improvement_plan
                SET original_end_date = target_end_date
                WHERE original_end_date IS NULL
                """);
        jdbc.execute("""
                UPDATE performance_improvement_plan
                SET status = CASE
                    WHEN status = 'PENDING_CREATION' THEN 'ACTIVE'
                    WHEN status = 'PENDING_CLOSE' THEN 'AUTO_CLOSED'
                    WHEN status = 'PENDING_REOPEN' THEN 'REOPEN_REQUESTED'
                    ELSE status
                END
                WHERE status IN ('PENDING_CREATION', 'PENDING_CLOSE', 'PENDING_REOPEN')
                """);
    }

    private void addColumnIfMissing(JdbcTemplate jdbc, String columnName, String definition) {
        if (!columnExists(jdbc, "performance_improvement_plan", columnName)) {
            jdbc.execute("ALTER TABLE performance_improvement_plan ADD COLUMN " + columnName + " " + definition);
            log.info("Added performance_improvement_plan.{}", columnName);
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
}
