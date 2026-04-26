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
public class EmployeeDepartmentHistoryTransferTypeColumnRenameInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee_department_history transfer_type column migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "employee_department_history")) {
            return;
        }

        if (indexExists(jdbc, "employee_department_history", "idx_edh_movement_type")) {
            jdbc.execute("DROP INDEX idx_edh_movement_type ON employee_department_history");
        }

        if (columnExists(jdbc, "employee_department_history", "movement_type")
                && !columnExists(jdbc, "employee_department_history", "transfer_type")) {
            jdbc.execute("""
                ALTER TABLE employee_department_history
                CHANGE COLUMN movement_type transfer_type ENUM('INITIAL','PERMANENT_TRANSFER','RETURN','TEMPORARY') NOT NULL
                """);
            log.info("Renamed employee_department_history.movement_type to transfer_type");
        }

        if (!indexExists(jdbc, "employee_department_history", "idx_edh_transfer_type")
                && columnExists(jdbc, "employee_department_history", "transfer_type")) {
            jdbc.execute("CREATE INDEX idx_edh_transfer_type ON employee_department_history(transfer_type)");
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
