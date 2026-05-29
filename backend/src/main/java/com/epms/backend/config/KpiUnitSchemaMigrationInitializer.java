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
public class KpiUnitSchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("KPI unit schema migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        makeUnitNullable(jdbc, "employeekpis");
        makeUnitNullable(jdbc, "position_kpis");
        makeUnitNullable(jdbc, "department_kpis");
        makeUnitNullable(jdbc, "kpi_template_items");
    }

    private static void makeUnitNullable(JdbcTemplate jdbc, String tableName) {
        if (!tableExists(jdbc, tableName) || !columnExists(jdbc, tableName, "unit")) {
            return;
        }
        jdbc.execute("ALTER TABLE `" + tableName + "` MODIFY COLUMN unit VARCHAR(255) NULL");
        log.info("Allowed null KPI unit values on {}", tableName);
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
