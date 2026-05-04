package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Ensures {@code employee.manager_id} exists for JPA {@link com.epms.backend.entity.Employee#getManager()},
 * with an index and self-FK to {@code employee(employee_id)}.
 */
@Component
@Slf4j
public class EmployeeManagerColumnMigrationInitializer implements BeanPostProcessor, Ordered {

    private static final String TABLE = "employee";
    private static final String COLUMN = "manager_id";
    private static final String INDEX_NAME = "idx_employee_manager_id";
    private static final String FK_NAME = "fk_employee_manager";

    @Override
    public int getOrder() {
        return 25;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee.manager_id migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, TABLE)) {
            return;
        }

        if (!columnExists(jdbc, TABLE, COLUMN)) {
            jdbc.execute(
                    """
                    ALTER TABLE employee
                    ADD COLUMN manager_id BIGINT NULL,
                    ADD INDEX %s (manager_id),
                    ADD CONSTRAINT %s FOREIGN KEY (manager_id) REFERENCES employee(employee_id)
                    """
                            .formatted(INDEX_NAME, FK_NAME));
            log.info("Added employee.manager_id with index {} and FK {}", INDEX_NAME, FK_NAME);
            return;
        }

        if (!foreignKeyExistsOnColumn(jdbc, TABLE, COLUMN)) {
            if (!nonPrimaryIndexExistsOnColumn(jdbc, TABLE, COLUMN)) {
                jdbc.execute("ALTER TABLE employee ADD INDEX `%s` (`%s`)".formatted(INDEX_NAME, COLUMN));
                log.info("Added index {} on employee.manager_id", INDEX_NAME);
            }
            jdbc.execute(
                    "ALTER TABLE employee ADD CONSTRAINT `%s` FOREIGN KEY (`%s`) REFERENCES employee(employee_id)"
                            .formatted(FK_NAME, COLUMN));
            log.info("Added FK {} on employee.manager_id", FK_NAME);
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

    private static boolean foreignKeyExistsOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = ?
                          AND COLUMN_NAME = ?
                          AND REFERENCED_TABLE_NAME IS NOT NULL
                        """,
                Boolean.class,
                tableName,
                columnName));
    }

    private static boolean nonPrimaryIndexExistsOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = ?
                          AND COLUMN_NAME = ?
                          AND INDEX_NAME <> 'PRIMARY'
                        """,
                Integer.class,
                tableName,
                columnName);
        return count != null && count > 0;
    }
}
