package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class SelfAssessmentManagerRevisionWorkflowMigrationInitializer implements BeanPostProcessor, Ordered {

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
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("self-assessment manager revision workflow migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form")) {
            return;
        }
        addColumnIfMissing(jdbc, "self_assessment_form", "manager_revised_total_score", "DECIMAL(10,4) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "final_approved_total_score", "DECIMAL(10,4) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "employee_acknowledged_at", "DATETIME(6) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "employee_disputed_at", "DATETIME(6) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "employee_dispute_reason", "TEXT NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "hr_review_required", "TINYINT(1) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "hr_review_reason", "TEXT NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "hr_review_reason_at", "DATETIME(6) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "requires_hr_review", "TINYINT(1) NULL");
        jdbc.update(
                "UPDATE self_assessment_form SET hr_review_reason_at = updated_date "
                        + "WHERE hr_review_reason IS NOT NULL AND TRIM(hr_review_reason) <> '' AND hr_review_reason_at IS NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "affects_compensation_or_pip", "TINYINT(1) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "company_policy_requires_hr_approval", "TINYINT(1) NULL");

        if (tableExists(jdbc, "self_assessment_form_answer")) {
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "final_approved_yes_no", "VARCHAR(10) NULL");
            addColumnIfMissing(jdbc, "self_assessment_form_answer", "final_approved_rating", "INT NULL");
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
