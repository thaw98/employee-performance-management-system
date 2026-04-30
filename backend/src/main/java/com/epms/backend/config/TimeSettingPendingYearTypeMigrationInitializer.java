package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class TimeSettingPendingYearTypeMigrationInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 17;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            if (tableExists(jdbc, "time_settings") && !columnExists(jdbc, "time_settings", "pending_year_type")) {
                jdbc.execute("ALTER TABLE time_settings ADD COLUMN pending_year_type VARCHAR(255) NULL AFTER year_type");
            }
            migrateLegacyDefaultTimeSetting(jdbc);
        } catch (Exception e) {
            throw new BeanCreationException("time_settings pending_year_type migration failed", e);
        }
        return bean;
    }

    private static void migrateLegacyDefaultTimeSetting(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "time_settings")) {
            return;
        }
        List<Map<String, Object>> settings = jdbc.queryForList("SELECT id, year_type, duration FROM time_settings");
        if (settings.isEmpty()) {
            return;
        }

        LocalDate start = currentBudgetYearStart();
        LocalDate end = start.plusMonths(6).minusDays(1);
        for (Map<String, Object> row : settings) {
            String yearType = String.valueOf(row.get("year_type"));
            String duration = String.valueOf(row.get("duration"));
            if (!"Calendar Year".equals(yearType) || !"1 Year".equals(duration)) {
                continue;
            }
            jdbc.update(
                    """
                            UPDATE time_settings
                            SET year_type = ?, duration = ?, period_type = ?, start_date = ?, end_date = ?, pending_year_type = NULL
                            WHERE id = ?
                            """,
                    "Budget Year",
                    "6 Months",
                    "SEMI_ANNUAL",
                    Date.valueOf(start),
                    Date.valueOf(end),
                    row.get("id"));
        }
    }

    private static LocalDate currentBudgetYearStart() {
        LocalDate today = LocalDate.now();
        LocalDate budgetStart = today.withMonth(4).withDayOfMonth(1);
        return today.isBefore(budgetStart) ? budgetStart.minusYears(1) : budgetStart;
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
