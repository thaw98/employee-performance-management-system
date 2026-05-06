package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class SelfAssessmentFormStatusNotStartedMigrationInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 20;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("self-assessment form status not_started migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form")) {
            return;
        }
        modifyEnumColumnIfNeeded(jdbc);
    }

    private void modifyEnumColumnIfNeeded(JdbcTemplate jdbc) {
        String currentType = getColumnType(jdbc, "self_assessment_form", "status");
        if (currentType == null || !currentType.contains("NOT_STARTED")) {
            String newDefinition = "ENUM('APPROVED','DRAFT','MANAGER_REVIEWED','NOT_STARTED','NOT_SUBMITTED','REOPENED','SUBMITTED') NOT NULL";
            jdbc.execute("ALTER TABLE `self_assessment_form` MODIFY COLUMN `status` " + newDefinition);
        }
    }

    private String getColumnType(JdbcTemplate jdbc, String tableName, String columnName) {
        try {
            return jdbc.queryForObject(
                    """
                            SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                            """,
                    String.class,
                    tableName,
                    columnName);
        } catch (Exception e) {
            return null;
        }
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                        """,
                Boolean.class,
                tableName));
    }
}