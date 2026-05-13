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
public class EmploymentStatusHistorySchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employment status history migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "employee")) {
            log.info("Skipping employment status history migration because employee table does not exist yet");
            return;
        }
        ensureEmployeeColumns(jdbc);
        ensureHistoryTable(jdbc);
        addMissingIndexes(jdbc);
    }

    private void ensureEmployeeColumns(JdbcTemplate jdbc) {
        if (!columnExists(jdbc, "employee", "status_effective_from")) {
            jdbc.execute("ALTER TABLE employee ADD COLUMN status_effective_from DATE NULL");
            log.info("Added employee.status_effective_from column");
        }
        if (!columnExists(jdbc, "employee", "employment_status_reason")) {
            jdbc.execute("ALTER TABLE employee ADD COLUMN employment_status_reason VARCHAR(255) NULL");
            log.info("Added employee.employment_status_reason column");
        }
    }

    private void ensureHistoryTable(JdbcTemplate jdbc) {
        if (tableExists(jdbc, "employment_status_history")) {
            return;
        }
        jdbc.execute("""
                CREATE TABLE employment_status_history (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    employee_id BIGINT NOT NULL,
                    previous_status VARCHAR(20) NULL,
                    new_status VARCHAR(20) NOT NULL,
                    effective_date DATE NOT NULL,
                    changed_by_user_id BIGINT NULL,
                    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    reason VARCHAR(255) NULL,
                    PRIMARY KEY (id),
                    CONSTRAINT fk_esh_employee FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
        log.info("Created employment_status_history table");
    }

    private void addMissingIndexes(JdbcTemplate jdbc) {
        if (!indexExists(jdbc, "employment_status_history", "idx_esh_employee_id")) {
            jdbc.execute("CREATE INDEX idx_esh_employee_id ON employment_status_history(employee_id)");
        }
        if (!indexExists(jdbc, "employment_status_history", "idx_esh_effective_date")) {
            jdbc.execute("CREATE INDEX idx_esh_effective_date ON employment_status_history(effective_date)");
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
