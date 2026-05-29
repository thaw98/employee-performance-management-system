package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class SelfAssessmentArchiveSnapshotSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 27;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("self_assessment_archive_snapshot migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (tableExists(jdbc, "self_assessment_archive_snapshot")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE self_assessment_archive_snapshot (
                id BIGINT NOT NULL AUTO_INCREMENT,
                original_form_id BIGINT NOT NULL,
                employee_id BIGINT NOT NULL,
                employee_name VARCHAR(255) NOT NULL,
                employee_staff_no VARCHAR(50) NULL,
                department_id BIGINT NULL,
                department_name VARCHAR(255) NULL,
                position_id BIGINT NULL,
                position_name VARCHAR(255) NULL,
                template_id BIGINT NULL,
                template_title VARCHAR(255) NOT NULL,
                cycle_id BIGINT NULL,
                cycle_name VARCHAR(255) NULL,
                archived_status VARCHAR(40) NOT NULL,
                rejection_reason TEXT NOT NULL,
                hr_user_id BIGINT NOT NULL,
                hr_user_name VARCHAR(255) NULL,
                archived_at DATETIME(6) NOT NULL,
                retake_deadline DATE NOT NULL,
                total_score DOUBLE PRECISION NULL,
                manager_revised_total_score DOUBLE PRECISION NULL,
                final_approved_total_score DOUBLE PRECISION NULL,
                rating_category VARCHAR(50) NULL,
                form_snapshot JSON NOT NULL,
                PRIMARY KEY (id),
                INDEX idx_sas_archive_original_form (original_form_id),
                INDEX idx_sas_archive_employee (employee_id),
                INDEX idx_sas_archive_archived_at (archived_at),
                INDEX idx_sas_archive_cycle (cycle_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
        log.info("Created self_assessment_archive_snapshot table");
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            Boolean.class, tableName));
    }
}
