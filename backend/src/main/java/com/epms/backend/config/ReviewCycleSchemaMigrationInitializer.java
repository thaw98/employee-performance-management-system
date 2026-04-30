package com.epms.backend.config;

import com.epms.backend.entity.ReviewCycle;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class ReviewCycleSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return 18;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("review cycle schema migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        createReviewCyclesTable(jdbc);
        dropForeignKeysOnColumn(jdbc, "self_assessment_form", "cycle_id");
        generateFromCurrentTimeSetting(jdbc);
        migrateSelfAssessmentCycleIds(jdbc);
    }

    private void createReviewCyclesTable(JdbcTemplate jdbc) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS review_cycles (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    time_setting_id BIGINT NULL,
                    parent_cycle_id BIGINT NULL,
                    name VARCHAR(255) NOT NULL,
                    code VARCHAR(255) NOT NULL,
                    cycle_type VARCHAR(50) NOT NULL,
                    year_label VARCHAR(50) NOT NULL,
                    sequence_no INT NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    requires_employee_submission BIT NOT NULL,
                    rollup_method VARCHAR(50) NULL,
                    created_at DATETIME(6) NOT NULL,
                    updated_at DATETIME(6) NOT NULL,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_review_cycles_year_type_sequence (year_label, cycle_type, sequence_no)
                )
                """);
    }

    private void generateFromCurrentTimeSetting(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "time_settings")) {
            return;
        }
        List<Map<String, Object>> settings = jdbc.queryForList("SELECT * FROM time_settings ORDER BY id ASC LIMIT 1");
        if (settings.isEmpty()) {
            return;
        }

        Map<String, Object> setting = settings.get(0);
        Long timeSettingId = ((Number) setting.get("id")).longValue();
        String yearType = String.valueOf(setting.get("year_type"));
        String duration = String.valueOf(setting.get("duration"));
        LocalDate start = currentYearStart(yearType);
        LocalDate end = calculateAnnualEndDate(start);
        String yearLabel = yearLabel(yearType, start);
        boolean hasChildren = !"1 Year".equals(duration);

        Long annualId = insertIfMissing(
                jdbc,
                timeSettingId,
                null,
                "Annual Cycle " + ("Calendar Year".equals(yearType) ? start.getYear() : yearLabel),
                code("ANNUAL", yearLabel, 0),
                ReviewCycle.CycleType.ANNUAL.name(),
                yearLabel,
                0,
                start,
                end,
                !hasChildren,
                ReviewCycle.RollupMethod.AVERAGE.name()
        );

        if (!hasChildren) {
            return;
        }

        int childMonths = "Both".equals(duration) ? 6 : parseMonths(duration);
        int totalMonths = Math.max(1, (int) Math.ceil((end.toEpochDay() - start.toEpochDay() + 1) / 31.0));
        int childCount = Math.max(1, (int) Math.ceil((double) totalMonths / childMonths));
        for (int i = 0; i < childCount; i++) {
            LocalDate childStart = start.plusMonths((long) i * childMonths);
            LocalDate childEnd = childStart.plusMonths(childMonths).minusDays(1);
            if (childEnd.isAfter(end)) {
                childEnd = end;
            }
            int sequenceNo = i + 1;
            String type = childMonths == 3
                    ? ReviewCycle.CycleType.QUARTERLY.name()
                    : childMonths == 6 ? ReviewCycle.CycleType.SEMI_ANNUAL.name() : ReviewCycle.CycleType.CUSTOM.name();
            String name = childMonths == 3 || childMonths == 6
                    ? "Q" + sequenceNo + " " + yearLabel
                    : "Cycle " + sequenceNo + " " + yearLabel;
            insertIfMissing(
                    jdbc,
                    timeSettingId,
                    annualId,
                    name,
                    code(childMonths == 3 ? "Q" : childMonths == 6 ? "H" : "C", yearLabel, sequenceNo),
                    type,
                    yearLabel,
                    sequenceNo,
                    childStart,
                    childEnd,
                    true,
                    null
            );
            if (!childEnd.isBefore(end)) {
                break;
            }
        }
    }

    private Long insertIfMissing(
            JdbcTemplate jdbc,
            Long timeSettingId,
            Long parentCycleId,
            String name,
            String code,
            String cycleType,
            String yearLabel,
            int sequenceNo,
            LocalDate startDate,
            LocalDate endDate,
            boolean requiresEmployeeSubmission,
            String rollupMethod
    ) {
        List<Long> ids = jdbc.query(
                "SELECT id FROM review_cycles WHERE year_label = ? AND cycle_type = ? AND sequence_no = ?",
                (rs, rowNum) -> rs.getLong("id"),
                yearLabel,
                cycleType,
                sequenceNo
        );
        if (!ids.isEmpty()) {
            Long existingId = ids.get(0);
            jdbc.update("""
                            UPDATE review_cycles
                            SET time_setting_id = ?,
                                parent_cycle_id = ?,
                                name = ?,
                                code = ?,
                                start_date = ?,
                                end_date = ?,
                                requires_employee_submission = ?,
                                rollup_method = ?,
                                updated_at = NOW(6)
                            WHERE id = ?
                            """,
                    timeSettingId,
                    parentCycleId,
                    name,
                    code,
                    startDate,
                    endDate,
                    requiresEmployeeSubmission,
                    rollupMethod,
                    existingId
            );
            return existingId;
        }
        jdbc.update("""
                        INSERT INTO review_cycles
                        (time_setting_id, parent_cycle_id, name, code, cycle_type, year_label, sequence_no,
                         start_date, end_date, requires_employee_submission, rollup_method, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6), NOW(6))
                        """,
                timeSettingId,
                parentCycleId,
                name,
                code,
                cycleType,
                yearLabel,
                sequenceNo,
                startDate,
                endDate,
                requiresEmployeeSubmission,
                rollupMethod
        );
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private void migrateSelfAssessmentCycleIds(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form") || !columnExists(jdbc, "self_assessment_form", "cycle_id")) {
            return;
        }
        LocalDate today = LocalDate.now();
        List<Long> activeSubmissionIds = jdbc.query(
                """
                        SELECT id FROM review_cycles
                        WHERE requires_employee_submission = 1
                          AND start_date <= ?
                          AND end_date >= ?
                        ORDER BY start_date DESC
                        LIMIT 1
                        """,
                (rs, rowNum) -> rs.getLong("id"),
                today,
                today
        );
        if (activeSubmissionIds.isEmpty()) {
            return;
        }
        Long activeCycleId = activeSubmissionIds.get(0);
        jdbc.update("""
                UPDATE self_assessment_form f
                LEFT JOIN review_cycles rc ON rc.id = f.cycle_id
                SET f.cycle_id = ?
                WHERE f.cycle_id IS NOT NULL
                  AND rc.id IS NULL
                """, activeCycleId);
    }

    private static void dropForeignKeysOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
        if (!tableExists(jdbc, tableName) || !columnExists(jdbc, tableName, columnName)) {
            return;
        }
        List<String> names = jdbc.query("""
                        SELECT DISTINCT CONSTRAINT_NAME
                        FROM information_schema.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = ?
                          AND COLUMN_NAME = ?
                          AND REFERENCED_TABLE_NAME IS NOT NULL
                        """,
                (rs, rowNum) -> rs.getString(1),
                tableName,
                columnName);
        for (String name : names) {
            if (name != null) {
                jdbc.execute("ALTER TABLE `" + tableName + "` DROP FOREIGN KEY `" + name + "`");
            }
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

    private LocalDate currentYearStart(String yearType) {
        LocalDate today = LocalDate.now();
        if ("Budget Year".equals(yearType)) {
            LocalDate start = today.withMonth(4).withDayOfMonth(1);
            return today.isBefore(start) ? start.minusYears(1) : start;
        }
        return today.withMonth(1).withDayOfMonth(1);
    }

    private String yearLabel(String yearType, LocalDate start) {
        if ("Budget Year".equals(yearType)) {
            return start.getYear() + "-" + (start.getYear() + 1);
        }
        return String.valueOf(start.getYear());
    }

    private int parseMonths(String duration) {
        try {
            return Math.max(1, Math.min(12, Integer.parseInt(duration.split(" ")[0])));
        } catch (Exception e) {
            return 12;
        }
    }

    private LocalDate calculateEndDate(LocalDate start, String duration) {
        if (duration != null && duration.contains("Months")) {
            return start.plusMonths(parseMonths(duration)).minusDays(1);
        }
        return start.plusYears(1).minusDays(1);
    }

    private LocalDate calculateAnnualEndDate(LocalDate start) {
        return start.plusYears(1).minusDays(1);
    }

    private String code(String prefix, String yearLabel, int sequenceNo) {
        return (prefix + "-" + yearLabel + "-" + sequenceNo).replaceAll("[^A-Za-z0-9-]", "-").toUpperCase(Locale.ROOT);
    }
}
