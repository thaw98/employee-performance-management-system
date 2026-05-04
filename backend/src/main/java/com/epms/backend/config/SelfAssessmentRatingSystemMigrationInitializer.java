package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class SelfAssessmentRatingSystemMigrationInitializer implements BeanPostProcessor, Ordered {

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
            throw new BeanCreationException("self-assessment rating system migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (tableExists(jdbc, "self_assessment_form_template")) {
            addColumnIfMissing(jdbc, "self_assessment_form_template", "rating_system", "VARCHAR(20) NOT NULL DEFAULT 'FIVE_POINT'");
            jdbc.update("""
                    UPDATE self_assessment_form_template
                    SET rating_system = 'FIVE_POINT'
                    WHERE rating_system IS NULL OR TRIM(rating_system) = ''
                    """);
        }
        if (tableExists(jdbc, "self_assessment_form")) {
            addColumnIfMissing(jdbc, "self_assessment_form", "rating_system", "VARCHAR(20) NOT NULL DEFAULT 'FIVE_POINT'");
            jdbc.update("""
                    UPDATE self_assessment_form
                    SET rating_system = 'FIVE_POINT'
                    WHERE rating_system IS NULL OR TRIM(rating_system) = ''
                    """);
        }
    }

    private static void addColumnIfMissing(JdbcTemplate jdbc, String tableName, String columnName, String definition) {
        if (!columnExists(jdbc, tableName, columnName)) {
            jdbc.execute("ALTER TABLE `" + tableName + "` ADD COLUMN `" + columnName + "` " + definition);
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
