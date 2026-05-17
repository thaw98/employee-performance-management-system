package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class SelfAssessmentRetakeWorkflowMigrationInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 26;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("self-assessment retake workflow migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form")) {
            return;
        }
        addColumnIfMissing(jdbc, "self_assessment_form", "retake_requested_at", "DATETIME(6) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "retake_submitted_at", "DATETIME(6) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "retake_request_used", "TINYINT(1) NOT NULL DEFAULT 0");
        addColumnIfMissing(jdbc, "self_assessment_form", "manager_approved_retake_at", "DATETIME(6) NULL");

        if (tableExists(jdbc, "self_assessment_form_answer")) {
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_requested", "TINYINT(1) NOT NULL DEFAULT 0");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_request_comment", "TEXT NULL");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_yes_no_answer", "VARCHAR(10) NULL");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_rating", "INT NULL");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_reason", "TEXT NULL");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_submitted_at", "DATETIME(6) NULL");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "retake_approved", "TINYINT(1) NULL");
        }
    }

    private static void addColumnIfMissing(JdbcTemplate jdbc, String tableName, String columnName, String definition) {
        if (!columnExists(jdbc, tableName, columnName)) {
            jdbc.execute("ALTER TABLE `" + tableName + "` ADD COLUMN `" + columnName + "` " + definition);
        }
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                Boolean.class,
                tableName));
    }

    private static boolean columnExists(JdbcTemplate jdbc, String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Boolean.class,
                tableName,
                columnName));
    }
}
