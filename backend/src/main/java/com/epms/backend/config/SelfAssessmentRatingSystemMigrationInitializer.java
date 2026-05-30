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
        createSettingsTable(jdbc);
        if (tableExists(jdbc, "self_assessment_form_template")) {
            addColumnIfMissing(jdbc, "self_assessment_form_template", "rating_system", "VARCHAR(20) NOT NULL DEFAULT 'FIVE_POINT'");
            addColumnIfMissing(jdbc, "self_assessment_form_template", "ten_point_yes_min_rating", "INT NOT NULL DEFAULT 5");
            addColumnIfMissing(jdbc, "self_assessment_form_template", "include_yes_no", "TINYINT(1) NOT NULL DEFAULT 1");
            jdbc.update("""
                    UPDATE self_assessment_form_template
                    SET rating_system = 'FIVE_POINT'
                    WHERE rating_system IS NULL OR TRIM(rating_system) = ''
                    """);
            normalizeThreshold(jdbc, "self_assessment_form_template");
        }
        if (tableExists(jdbc, "self_assessment_form")) {
            addColumnIfMissing(jdbc, "self_assessment_form", "rating_system", "VARCHAR(20) NOT NULL DEFAULT 'FIVE_POINT'");
            addColumnIfMissing(jdbc, "self_assessment_form", "ten_point_yes_min_rating", "INT NOT NULL DEFAULT 5");
            addColumnIfMissing(jdbc, "self_assessment_form", "include_yes_no", "TINYINT(1) NOT NULL DEFAULT 1");
            jdbc.update("""
                    UPDATE self_assessment_form
                    SET rating_system = 'FIVE_POINT'
                    WHERE rating_system IS NULL OR TRIM(rating_system) = ''
                    """);
            normalizeThreshold(jdbc, "self_assessment_form");
        }
        if (tableExists(jdbc, "copied_self_assessment_form_template")) {
            addColumnIfMissing(jdbc, "copied_self_assessment_form_template", "rating_system", "VARCHAR(20) NOT NULL DEFAULT 'FIVE_POINT'");
            addColumnIfMissing(jdbc, "copied_self_assessment_form_template", "ten_point_yes_min_rating", "INT NOT NULL DEFAULT 5");
            addColumnIfMissing(jdbc, "copied_self_assessment_form_template", "include_yes_no", "TINYINT(1) NOT NULL DEFAULT 1");
            jdbc.update("""
                    UPDATE copied_self_assessment_form_template
                    SET rating_system = 'FIVE_POINT'
                    WHERE rating_system IS NULL OR TRIM(rating_system) = ''
                    """);
            normalizeThreshold(jdbc, "copied_self_assessment_form_template");
        }
    }

    private void createSettingsTable(JdbcTemplate jdbc) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS self_assessment_settings (
                    id BIGINT NOT NULL PRIMARY KEY,
                    rating_system VARCHAR(20) NOT NULL DEFAULT 'FIVE_POINT',
                    ten_point_yes_min_rating INT NOT NULL DEFAULT 5,
                    updated_by BIGINT NULL,
                    updated_on DATETIME(6) NULL
                )
                """);
        addColumnIfMissing(jdbc, "self_assessment_settings", "ten_point_yes_min_rating", "INT NOT NULL DEFAULT 5");
        addColumnIfMissing(jdbc, "self_assessment_settings", "include_yes_no", "TINYINT(1) NOT NULL DEFAULT 1");
        jdbc.update("""
                INSERT INTO self_assessment_settings (id, rating_system, ten_point_yes_min_rating)
                SELECT 1, 'FIVE_POINT', 5
                WHERE NOT EXISTS (SELECT 1 FROM self_assessment_settings WHERE id = 1)
                """);
        jdbc.update("""
                UPDATE self_assessment_settings
                SET rating_system = 'FIVE_POINT'
                WHERE rating_system IS NULL OR TRIM(rating_system) = ''
                """);
        normalizeThreshold(jdbc, "self_assessment_settings");
    }

    private static void normalizeThreshold(JdbcTemplate jdbc, String tableName) {
        jdbc.update("""
                UPDATE `%s`
                SET ten_point_yes_min_rating = 5
                WHERE ten_point_yes_min_rating IS NULL
                   OR ten_point_yes_min_rating < 2
                   OR ten_point_yes_min_rating > 10
                """.formatted(tableName));
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
