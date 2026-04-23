package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Adds before_data and after_data JSON columns to audit_log for movement audit trails.
 */
@Component
@Slf4j
public class AuditLogBeforeAfterColumnsMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("audit_log before/after columns migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "audit_log")) {
            return;
        }
        if (!columnExists(jdbc, "audit_log", "before_data")) {
            jdbc.execute("ALTER TABLE audit_log ADD COLUMN before_data LONGTEXT NULL AFTER metadata_json");
            log.info("Added audit_log.before_data column");
        }
        if (!columnExists(jdbc, "audit_log", "after_data")) {
            jdbc.execute("ALTER TABLE audit_log ADD COLUMN after_data LONGTEXT NULL AFTER before_data");
            log.info("Added audit_log.after_data column");
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
}
