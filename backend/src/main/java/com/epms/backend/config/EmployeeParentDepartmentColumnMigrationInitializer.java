package com.epms.backend.config;

import java.util.List;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Drops employee.parent_department_id — home department is now derived from
 * employee_department_history instead of being stored redundantly.
 */
@Component
@Slf4j
public class EmployeeParentDepartmentColumnMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee.parent_department_id drop migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "employee")) {
            return;
        }
        if (!columnExists(jdbc, "employee", "parent_department_id")) {
            return;
        }
        // Drop FK constraint referencing this column before dropping the column
        List<String> fkNames = jdbc.queryForList(
            """
            SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'employee'
              AND COLUMN_NAME = 'parent_department_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            """,
            String.class);
        for (String fk : fkNames) {
            jdbc.execute("ALTER TABLE employee DROP FOREIGN KEY `" + fk + "`");
            log.info("Dropped FK {} on employee.parent_department_id", fk);
        }
        jdbc.execute("ALTER TABLE employee DROP COLUMN parent_department_id");
        log.info("Dropped employee.parent_department_id column — home department is now derived from movement history");
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
}
