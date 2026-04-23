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
public class EmployeeDepartmentHistorySchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee_department_history migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (tableExists(jdbc, "employee_department_history")) {
            addMissingIndexes(jdbc);
            return;
        }
        jdbc.execute("""
            CREATE TABLE employee_department_history (
                id BIGINT NOT NULL AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                from_department_id BIGINT NULL,
                to_department_id BIGINT NOT NULL,
                from_position_id BIGINT NULL,
                to_position_id BIGINT NOT NULL,
                movement_type VARCHAR(30) NOT NULL,
                effective_start_date DATE NOT NULL,
                effective_end_date DATE NULL,
                reason TEXT NULL,
                remarks TEXT NULL,
                is_current BIT(1) NOT NULL DEFAULT 0,
                created_by BIGINT NULL,
                created_on DATETIME NOT NULL,
                updated_by BIGINT NULL,
                updated_on DATETIME NULL,
                PRIMARY KEY (id),
                CONSTRAINT fk_edh_employee FOREIGN KEY (employee_id) REFERENCES employee(employee_id),
                CONSTRAINT fk_edh_from_dept FOREIGN KEY (from_department_id) REFERENCES department(id),
                CONSTRAINT fk_edh_to_dept FOREIGN KEY (to_department_id) REFERENCES department(id),
                CONSTRAINT fk_edh_from_pos FOREIGN KEY (from_position_id) REFERENCES position(id),
                CONSTRAINT fk_edh_to_pos FOREIGN KEY (to_position_id) REFERENCES position(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
        addMissingIndexes(jdbc);
        log.info("Created employee_department_history table");
    }

    private void addMissingIndexes(JdbcTemplate jdbc) {
        if (!indexExists(jdbc, "employee_department_history", "idx_edh_employee_current")) {
            jdbc.execute("CREATE INDEX idx_edh_employee_current ON employee_department_history(employee_id, is_current)");
        }
        if (!indexExists(jdbc, "employee_department_history", "idx_edh_employee_start")) {
            jdbc.execute("CREATE INDEX idx_edh_employee_start ON employee_department_history(employee_id, effective_start_date)");
        }
        if (!indexExists(jdbc, "employee_department_history", "idx_edh_movement_type")) {
            jdbc.execute("CREATE INDEX idx_edh_movement_type ON employee_department_history(movement_type)");
        }
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            Boolean.class, tableName));
    }

    private static boolean indexExists(JdbcTemplate jdbc, String tableName, String indexName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
            Boolean.class, tableName, indexName));
    }
}
