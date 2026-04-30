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
 * Drops legacy {@code signatures.name} column after signature naming was removed.
 */
@Component
@Slf4j
public class SignatureNameColumnDropInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 22;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            dropColumnIfPresent(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("signature name column cleanup failed", e);
        }
        return bean;
    }

    private void dropColumnIfPresent(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (!tableExists(jdbc, "signatures")) {
            return;
        }
        if (!columnExists(jdbc, "signatures", "name")) {
            return;
        }
        jdbc.execute("ALTER TABLE signatures DROP COLUMN `name`");
        log.info("Dropped legacy signatures.name column");
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
