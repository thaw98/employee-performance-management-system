package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class SelfAssessmentHrSignerNameMigrationInitializer implements BeanPostProcessor, Ordered {

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
            throw new BeanCreationException("self-assessment hr signer name migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form")) {
            return;
        }
        addColumnIfMissing(jdbc, "self_assessment_form", "hr_signer_name", "VARCHAR(255) NULL");
        jdbc.update("""
                UPDATE self_assessment_form f
                INNER JOIN signatures s ON s.id = COALESCE(
                    f.hr_final_signature_id, f.hr_signature_id, f.hr_adjustment_signature_id)
                INNER JOIN user_account u ON u.user_id = s.user_id
                INNER JOIN employee e ON e.employee_id = u.employee_id
                SET f.hr_signer_name = e.full_name
                WHERE (f.hr_signer_name IS NULL OR TRIM(f.hr_signer_name) = '')
                  AND COALESCE(
                    f.hr_final_signature_id, f.hr_signature_id, f.hr_adjustment_signature_id) IS NOT NULL
                  AND e.full_name IS NOT NULL
                  AND TRIM(e.full_name) <> ''
                """);
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
