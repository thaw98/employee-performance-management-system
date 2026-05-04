package com.epms.backend.config;

import java.util.List;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Drops employee.manager_id. Department-level manager assignment is now the source of truth.
 */
@Component
@Slf4j
public class EmployeeManagerColumnDropInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 24;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            dropManagerColumnIfPresent(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee.manager_id drop migration failed", e);
        }
        return bean;
    }

    private void dropManagerColumnIfPresent(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "employee") || !columnExists(jdbc, "employee", "manager_id")) {
            return;
        }

        List<String> foreignKeys = jdbc.queryForList(
            """
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'employee'
              AND COLUMN_NAME = 'manager_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            """,
            String.class);
        for (String fk : foreignKeys) {
            jdbc.execute("ALTER TABLE employee DROP FOREIGN KEY `" + fk + "`");
            log.info("Dropped FK {} on employee.manager_id", fk);
        }

        List<String> indexes = jdbc.queryForList(
            """
            SELECT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'employee'
              AND COLUMN_NAME = 'manager_id'
              AND INDEX_NAME <> 'PRIMARY'
            """,
            String.class);
        for (String indexName : indexes) {
            jdbc.execute("ALTER TABLE employee DROP INDEX `" + indexName + "`");
            log.info("Dropped index {} on employee.manager_id", indexName);
        }

        jdbc.execute("ALTER TABLE employee DROP COLUMN manager_id");
        log.info("Dropped employee.manager_id; manager is now resolved from department.manager_id");
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            """
            SELECT COUNT(*) > 0
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            """,
            Boolean.class,
            tableName));
    }

    private static boolean columnExists(JdbcTemplate jdbc, String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            """
            SELECT COUNT(*) > 0
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
            """,
            Boolean.class,
            tableName,
            columnName));
    }
}
