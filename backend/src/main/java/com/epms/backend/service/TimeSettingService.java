package com.epms.backend.service;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.PeriodDto;
import com.epms.backend.dto.TimeSettingDto;
import com.epms.backend.entity.Period;
import com.epms.backend.entity.TimeSetting;
import com.epms.backend.repository.PeriodRepository;
import com.epms.backend.repository.TimeSettingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.time.LocalDate;
import java.util.Objects;

@Service
public class TimeSettingService {

    private final TimeSettingRepository repository;
    private final PeriodRepository periodRepository;
    private final ReviewCycleService reviewCycleService;
    private final AuditService auditService;

    @PersistenceContext
    private EntityManager entityManager;

    public TimeSettingService(TimeSettingRepository repository, PeriodRepository periodRepository,
                              ReviewCycleService reviewCycleService, AuditService auditService) {
        this.repository = repository;
        this.periodRepository = periodRepository;
        this.reviewCycleService = reviewCycleService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public TimeSettingDto getSettings() {
        return repository.findFirstByOrderByIdAsc()
                .map(this::toDto)
                .orElseGet(this::defaultSettings);
    }

    /**
     * Start/end dates of the organization's active annual cycle (same bounds as time settings).
     */
    @Transactional(readOnly = true)
    public TimeSettingDto getCurrentCycleRange() {
        return getSettings();
    }

    @Transactional
    public TimeSettingDto saveSettings(TimeSettingDto dto, Long actingUserId, Long actingRoleId) {
        TimeSetting setting = repository.findFirstByOrderByIdAsc().orElse(new TimeSetting());
        if (setting.getYearType() == null) {
            setting.setYearType("Budget Year");
        }

        String oldYearType = setting.getYearType();
        String oldPendingYearType = setting.getPendingYearType();
        String oldDuration = setting.getDuration();
        LocalDate oldStart = setting.getStartDate();
        LocalDate oldEnd = setting.getEndDate();

        String requestedYearType = normalizeYearType(dto.getYearType());
        TimeSetting.PeriodType periodType = resolvePeriodType(dto);
        String requestedDuration = normalizeDuration(dto.getDuration(), periodType);

        LocalDate today = LocalDate.now();
        LocalDate currentStart = setting.getStartDate() != null ? setting.getStartDate() : getYearStart(oldYearType);
        LocalDate currentEnd = calculateAnnualEndDate(currentStart);
        if (isShortening(oldEnd, currentEnd)) {
            validateNoRecordsBeyondNewEnd(currentStart, currentEnd, oldYearType);
        }

        boolean currentCycleAlreadyStarted = !today.isBefore(currentStart);
        if (!Objects.equals(requestedYearType, oldYearType)) {
            if (currentCycleAlreadyStarted) {
                setting.setPendingYearType(requestedYearType);
            } else {
                setting.setYearType(requestedYearType);
                setting.setPendingYearType(null);
                currentStart = getYearStart(requestedYearType);
                currentEnd = calculateAnnualEndDate(currentStart);
            }
        }

        setting.setPeriodType(periodType);
        setting.setDuration(requestedDuration);
        setting.setStartDate(currentStart);
        setting.setEndDate(currentEnd);

        TimeSetting saved = repository.save(setting);
        replacePeriods(saved);
        reviewCycleService.syncCurrentCycles(saved);

        auditService.record(
                AuditActionType.TIME_SETTINGS_UPDATED,
                AuditTargetType.TIME_SETTING,
                saved.getId(),
                actingUserId,
                actingRoleId,
                "Updated organization time settings",
                metadataJson(oldYearType, requestedYearType, saved.getYearType(), saved.getPendingYearType(),
                        oldPendingYearType, oldDuration, saved.getDuration(), oldStart, oldEnd,
                        saved.getStartDate(), saved.getEndDate(), actingUserId)
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public TimeSettingDto getCurrentCycleRange() {
        TimeSetting setting = repository.findFirstByOrderByIdAsc().orElse(null);
        if (setting == null) {
            // Default to calendar year if not set
            LocalDate start = LocalDate.now().withMonth(1).withDayOfMonth(1);
            return new TimeSettingDto("Calendar Year", null, start, start.plusYears(1).minusDays(1), "1 Year", null, null);
        }

        LocalDate today = LocalDate.now();
        int durationMonths = setting.getDuration().contains("Months") 
            ? Integer.parseInt(setting.getDuration().split(" ")[0]) 
            : 12;

        int startMonth = "Budget Year".equals(setting.getYearType()) ? 4 : 1;
        LocalDate orgYearStart = today.withMonth(startMonth).withDayOfMonth(1);
        
        if ("Budget Year".equals(setting.getYearType()) && today.isBefore(orgYearStart)) {
            orgYearStart = orgYearStart.minusYears(1);
        } else if ("Calendar Year".equals(setting.getYearType()) && today.isBefore(orgYearStart)) {
             // For calendar, today.isBefore(Jan 1) is impossible unless we handle year wrap
        }

        LocalDate cycleStart = orgYearStart;
        LocalDate cycleEnd = orgYearStart.plusMonths(durationMonths).minusDays(1);

        while (today.isAfter(cycleEnd)) {
            cycleStart = cycleEnd.plusDays(1);
            cycleEnd = cycleStart.plusMonths(durationMonths).minusDays(1);
        }

        return new TimeSettingDto(setting.getYearType(), null, cycleStart, cycleEnd, setting.getDuration(), null, null);
    }

    private TimeSettingDto toDto(TimeSetting entity) {
        List<Period> periods = periodRepository.findByTimeSettingIdOrderByStartDateAscPeriodTypeAsc(entity.getId());
        if (periods.isEmpty()) {
            periods = generatePeriods(entity);
        }

        return new TimeSettingDto(
                entity.getYearType(),
                entity.getPendingYearType(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getDuration(),
                entity.getPeriodType() != null ? entity.getPeriodType().name() : null,
                periods.stream().map(this::toPeriodDto).toList()
        );
    }

    private TimeSettingDto defaultSettings() {
        LocalDate start = getYearStart("Budget Year");
        LocalDate end = calculateAnnualEndDate(start);
        Period period = buildPeriod("Annual", start, end, Period.PeriodType.ANNUAL, null);
        return new TimeSettingDto("Budget Year", null, start, end, "1 Year", TimeSetting.PeriodType.ANNUAL.name(), List.of(toPeriodDto(period)));
    }

    private void replacePeriods(TimeSetting setting) {
        periodRepository.deleteByTimeSettingId(setting.getId());
        periodRepository.saveAll(generatePeriods(setting));
    }

    private List<Period> generatePeriods(TimeSetting setting) {
        List<Period> periods = new ArrayList<>();
        TimeSetting.PeriodType periodType = setting.getPeriodType() != null ? setting.getPeriodType() : resolvePeriodType(setting.getDuration());
        LocalDate start = setting.getStartDate();
        LocalDate annualEnd = setting.getEndDate() != null ? setting.getEndDate() : calculateAnnualEndDate(start);

        if (periodType == TimeSetting.PeriodType.BOTH || periodType == TimeSetting.PeriodType.ANNUAL) {
            periods.add(buildPeriod("Annual", start, annualEnd, Period.PeriodType.ANNUAL, setting.getId()));
        }

        if (periodType == TimeSetting.PeriodType.BOTH || periodType == TimeSetting.PeriodType.SEMI_ANNUAL) {
            periods.add(buildPeriod("Semi-annual 1", start, start.plusMonths(6).minusDays(1), Period.PeriodType.SEMI_ANNUAL, setting.getId()));
            periods.add(buildPeriod("Semi-annual 2", start.plusMonths(6), annualEnd, Period.PeriodType.SEMI_ANNUAL, setting.getId()));
        }

        periods.sort(Comparator
                .comparing((Period period) -> period.getPeriodType() == Period.PeriodType.ANNUAL ? 0 : 1)
                .thenComparing(Period::getStartDate));
        return periods;
    }

    private Period buildPeriod(String name, LocalDate startDate, LocalDate endDate, Period.PeriodType periodType, Long timeSettingId) {
        Period period = new Period();
        period.setName(name);
        period.setStartDate(startDate);
        period.setEndDate(endDate);
        period.setPeriodType(periodType);
        period.setTimeSettingId(timeSettingId);
        return period;
    }

    private PeriodDto toPeriodDto(Period period) {
        return new PeriodDto(
                period.getId(),
                period.getName(),
                period.getStartDate(),
                period.getEndDate(),
                period.getPeriodType().name(),
                period.getTimeSettingId()
        );
    }

    LocalDate getYearStart(String yearType) {
        LocalDate today = LocalDate.now();
        if ("Budget Year".equals(yearType)) {
            LocalDate budgetStart = today.withMonth(4).withDayOfMonth(1);
            return today.isBefore(budgetStart) ? budgetStart.minusYears(1) : budgetStart;
        }
        return today.withMonth(1).withDayOfMonth(1);
    }

    private TimeSetting.PeriodType resolvePeriodType(TimeSettingDto dto) {
        if (dto.getPeriodType() != null && !dto.getPeriodType().isBlank()) {
            return TimeSetting.PeriodType.valueOf(dto.getPeriodType());
        }
        return resolvePeriodType(dto.getDuration());
    }

    private TimeSetting.PeriodType resolvePeriodType(String duration) {
        if ("Both".equals(duration)) {
            return TimeSetting.PeriodType.BOTH;
        }
        if ("6 Months".equals(duration)) {
            return TimeSetting.PeriodType.SEMI_ANNUAL;
        }
        if ("1 Year".equals(duration)) {
            return TimeSetting.PeriodType.ANNUAL;
        }
        return null;
    }

    LocalDate calculateEndDate(LocalDate start, String duration) {
        if (duration != null && duration.contains("Months")) {
            return start.plusMonths(parseMonths(duration)).minusDays(1);
        }
        return start.plusYears(1).minusDays(1);
    }

    LocalDate calculateAnnualEndDate(LocalDate start) {
        return start.plusYears(1).minusDays(1);
    }

    private boolean isShortening(LocalDate oldEnd, LocalDate newEnd) {
        return oldEnd != null && newEnd.isBefore(oldEnd);
    }

    private String normalizeYearType(String yearType) {
        return "Budget Year".equals(yearType) ? "Budget Year" : "Calendar Year";
    }

    private String normalizeDuration(String duration, TimeSetting.PeriodType periodType) {
        if (periodType == TimeSetting.PeriodType.BOTH) {
            return "Both";
        }
        if (duration == null || duration.isBlank()) {
            return "6 Months";
        }
        if (duration.contains("Months")) {
            return parseMonths(duration) + " Months";
        }
        if ("6 Months".equals(duration) || "1 Year".equals(duration)) {
            return duration;
        }
        return "6 Months";
    }

    private int parseMonths(String duration) {
        try {
            return Math.max(1, Math.min(12, Integer.parseInt(duration.split(" ")[0])));
        } catch (Exception e) {
            return 12;
        }
    }

    private void validateNoRecordsBeyondNewEnd(LocalDate cycleStart, LocalDate newEnd, String yearType) {
        List<String> blockers = new ArrayList<>();
        String currentLabel = yearLabel(yearType, cycleStart);

        if (tableExists("performance_improvement_plan")
                && count("SELECT COUNT(*) FROM performance_improvement_plan WHERE target_end_date > :newEnd", newEnd, null) > 0) {
            blockers.add("performance records");
        }
        if (tableExists("feedback")
                && count("SELECT COUNT(*) FROM feedback WHERE DATE(feedback_date) > :newEnd", newEnd, null) > 0) {
            blockers.add("reviews");
        }
        if (tableExists("appraisal_assignments")
                && count("SELECT COUNT(*) FROM appraisal_assignments aa JOIN appraisal_cycle ac ON ac.cycle_id = aa.period_id WHERE ac.end_date > :newEnd", newEnd, null) > 0) {
            blockers.add("appraisals");
        }
        if (tableExists("self_assessment_form")
                && count("SELECT COUNT(*) FROM self_assessment_form f JOIN review_cycles rc ON rc.id = f.cycle_id WHERE rc.end_date > :newEnd", newEnd, null) > 0) {
            blockers.add("self-assessment forms");
        }
        if (tableExists("employeekpis") && countPeriodRowsAfter("employeekpis", currentLabel, newEnd) > 0) {
            blockers.add("employee KPIs");
        }
        if (tableExists("position_kpis") && countPeriodRowsAfter("position_kpis", currentLabel, newEnd) > 0) {
            blockers.add("position KPIs");
        }

        if (!blockers.isEmpty()) {
            throw new IllegalArgumentException("Cannot shorten Duration Cycle because existing "
                    + String.join(", ", blockers)
                    + " would fall beyond the new current cycle end date (" + newEnd + ").");
        }
    }

    private long count(String sql, LocalDate newEnd, LocalDate oldEnd) {
        var query = entityManager.createNativeQuery(sql).setParameter("newEnd", newEnd);
        if (oldEnd != null) {
            query.setParameter("oldEnd", oldEnd);
        }
        return ((Number) query.getSingleResult()).longValue();
    }

    private long countPeriodRowsAfter(String tableName, String currentLabel, LocalDate newEnd) {
        @SuppressWarnings("unchecked")
        List<String> periods = entityManager.createNativeQuery("SELECT DISTINCT period FROM " + tableName + " WHERE period IS NOT NULL")
                .getResultList();
        return periods.stream()
                .filter(currentLabel::equals)
                .filter(period -> periodEnd(period).isAfter(newEnd))
                .count();
    }

    private boolean tableExists(String tableName) {
        Number count = (Number) entityManager.createNativeQuery("""
                        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName
                        """)
                .setParameter("tableName", tableName)
                .getSingleResult();
        return count.longValue() > 0;
    }

    private String yearLabel(String yearType, LocalDate start) {
        if ("Budget Year".equals(yearType)) {
            return start.getYear() + "-" + (start.getYear() + 1);
        }
        return String.valueOf(start.getYear());
    }

    private LocalDate periodEnd(String period) {
        try {
            if (period != null && period.matches("\\d{4}-\\d{4}")) {
                return LocalDate.of(Integer.parseInt(period.substring(5, 9)), 3, 31);
            }
            if (period != null && period.matches("\\d{4}")) {
                return LocalDate.of(Integer.parseInt(period), 12, 31);
            }
        } catch (Exception ignored) {
        }
        return LocalDate.MIN;
    }

    private String metadataJson(String oldYearType, String requestedYearType, String appliedYearType,
                                String pendingYearType, String oldPendingYearType, String oldDuration,
                                String newDuration, LocalDate oldStart, LocalDate oldEnd,
                                LocalDate newStart, LocalDate newEnd, Long actingUserId) {
        return "{"
                + json("oldYearType", oldYearType) + ","
                + json("newRequestedYearType", requestedYearType) + ","
                + json("appliedYearType", appliedYearType) + ","
                + json("pendingYearType", pendingYearType) + ","
                + json("oldPendingYearType", oldPendingYearType) + ","
                + json("oldDuration", oldDuration) + ","
                + json("newDuration", newDuration) + ","
                + json("oldStart", oldStart) + ","
                + json("oldEnd", oldEnd) + ","
                + json("newStart", newStart) + ","
                + json("newEnd", newEnd) + ","
                + json("actingHrUser", actingUserId)
                + "}";
    }

    private String json(String key, Object value) {
        return "\"" + key + "\":" + (value == null ? "null" : "\"" + String.valueOf(value).replace("\"", "\\\"") + "\"");
    }
}
