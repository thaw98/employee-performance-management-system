package com.epms.backend.service;

import com.epms.backend.dto.ReviewCycleDto;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.TimeSetting;
import com.epms.backend.repository.ReviewCycleRepository;
import com.epms.backend.repository.TimeSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ReviewCycleService {

    private final ReviewCycleRepository reviewCycleRepository;
    private final TimeSettingRepository timeSettingRepository;

    public ReviewCycleService(ReviewCycleRepository reviewCycleRepository, TimeSettingRepository timeSettingRepository) {
        this.reviewCycleRepository = reviewCycleRepository;
        this.timeSettingRepository = timeSettingRepository;
    }

    @Transactional
    public List<ReviewCycleDto> previewCurrentYear() {
        TimeSetting setting = currentSetting();
        return buildCycles(setting).stream().map(this::toDto).toList();
    }

    @Transactional
    public List<ReviewCycleDto> generateCurrentYear() {
        TimeSetting setting = currentSetting();
        List<ReviewCycle> desiredCycles = buildCycles(setting);
        ReviewCycle annualParent = null;
        List<ReviewCycle> savedCycles = new ArrayList<>();

        for (ReviewCycle desired : desiredCycles) {
            if (desired.getCycleType() == ReviewCycle.CycleType.ANNUAL) {
                annualParent = saveOrGet(desired, setting, null);
                savedCycles.add(annualParent);
                break;
            }
        }

        for (ReviewCycle desired : desiredCycles) {
            if (desired.getCycleType() == ReviewCycle.CycleType.ANNUAL) {
                continue;
            }
            savedCycles.add(saveOrGet(desired, setting, annualParent));
        }

        return savedCycles.stream()
                .sorted(Comparator.comparing(ReviewCycle::getStartDate).thenComparing(ReviewCycle::getSequenceNo))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewCycleDto> getCycles(String status, String cycleType, Boolean requiresEmployeeSubmission) {
        LocalDate today = LocalDate.now();
        return reviewCycleRepository.findAll().stream()
                .filter(c -> status == null || status.equalsIgnoreCase(statusOf(c, today)))
                .filter(c -> cycleType == null || c.getCycleType().name().equalsIgnoreCase(cycleType))
                .filter(c -> requiresEmployeeSubmission == null || c.isRequiresEmployeeSubmission() == requiresEmployeeSubmission)
                .sorted(Comparator.comparing(ReviewCycle::getStartDate).thenComparing(ReviewCycle::getSequenceNo))
                .map(c -> toDto(c, today))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewCycleDto> getActiveCycles() {
        LocalDate today = LocalDate.now();
        return reviewCycleRepository
                .findByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByRequiresEmployeeSubmissionDescStartDateDesc(today, today)
                .stream()
                .map(c -> toDto(c, today))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewCycle getActiveSubmissionCycle() {
        LocalDate today = LocalDate.now();
        return reviewCycleRepository
                .findByRequiresEmployeeSubmissionTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateDesc(today, today)
                .stream()
                .findFirst()
                .orElse(null);
    }

    private ReviewCycle saveOrGet(ReviewCycle desired, TimeSetting setting, ReviewCycle parentCycle) {
        Optional<ReviewCycle> existing = reviewCycleRepository.findByYearLabelAndSequenceNoOrderByIdAsc(
                desired.getYearLabel(),
                desired.getSequenceNo()
        ).stream().findFirst();
        if (existing.isPresent()) {
            ReviewCycle cycle = existing.get();
            applyDesired(cycle, desired, setting, parentCycle);
            return reviewCycleRepository.save(cycle);
        }
        desired.setTimeSetting(setting);
        desired.setParentCycle(parentCycle);
        return reviewCycleRepository.save(desired);
    }

    @Transactional
    public List<ReviewCycleDto> syncCurrentCycles(TimeSetting setting) {
        List<ReviewCycle> desiredCycles = buildCycles(setting);
        ReviewCycle annualParent = null;
        List<ReviewCycle> savedCycles = new ArrayList<>();

        for (ReviewCycle desired : desiredCycles) {
            if (desired.getCycleType() == ReviewCycle.CycleType.ANNUAL) {
                annualParent = saveOrGet(desired, setting, null);
                savedCycles.add(annualParent);
                break;
            }
        }

        for (ReviewCycle desired : desiredCycles) {
            if (desired.getCycleType() == ReviewCycle.CycleType.ANNUAL) {
                continue;
            }
            savedCycles.add(saveOrGet(desired, setting, annualParent));
        }

        return savedCycles.stream()
                .sorted(Comparator.comparing(ReviewCycle::getStartDate).thenComparing(ReviewCycle::getSequenceNo))
                .map(this::toDto)
                .toList();
    }

    private void applyDesired(ReviewCycle target, ReviewCycle desired, TimeSetting setting, ReviewCycle parentCycle) {
        target.setTimeSetting(setting);
        target.setParentCycle(parentCycle);
        target.setName(desired.getName());
        target.setCode(desired.getCode());
        target.setCycleType(desired.getCycleType());
        target.setYearLabel(desired.getYearLabel());
        target.setSequenceNo(desired.getSequenceNo());
        target.setStartDate(desired.getStartDate());
        target.setEndDate(desired.getEndDate());
        target.setRequiresEmployeeSubmission(desired.isRequiresEmployeeSubmission());
        target.setRollupMethod(desired.getRollupMethod());
    }

    private List<ReviewCycle> buildCycles(TimeSetting setting) {
        LocalDate start = setting.getStartDate() != null ? setting.getStartDate() : getCurrentYearStart(setting.getYearType());
        LocalDate end = setting.getEndDate() != null ? setting.getEndDate() : calculateEndDate(start, setting.getDuration());
        String yearLabel = yearLabel(setting.getYearType(), start);
        String duration = setting.getDuration();
        int months = duration != null && duration.contains("Months") ? parseMonths(duration) : 12;
        boolean hasChildren = !"1 Year".equals(duration);

        List<ReviewCycle> cycles = new ArrayList<>();
        cycles.add(buildAnnual(setting, yearLabel, start, end, !hasChildren));

        if ("1 Year".equals(duration)) {
            return cycles;
        }

        int childMonths = "Both".equals(duration) ? 6 : months;
        int totalMonths = Math.max(1, (int) Math.ceil((end.toEpochDay() - start.toEpochDay() + 1) / 31.0));
        int childCount = Math.max(1, (int) Math.ceil((double) totalMonths / childMonths));
        for (int i = 0; i < childCount; i++) {
            LocalDate childStart = start.plusMonths((long) i * childMonths);
            LocalDate childEnd = childStart.plusMonths(childMonths).minusDays(1);
            if (childEnd.isAfter(end)) {
                childEnd = end;
            }
            cycles.add(buildChild(setting, yearLabel, childStart, childEnd, i + 1, childMonths));
            if (!childEnd.isBefore(end)) {
                break;
            }
        }
        return cycles;
    }

    private ReviewCycle buildAnnual(TimeSetting setting, String yearLabel, LocalDate start, LocalDate end, boolean requiresSubmission) {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setTimeSetting(setting);
        cycle.setName("Annual Cycle " + (start.getMonthValue() == 1 ? start.getYear() : yearLabel));
        cycle.setCode(code("ANNUAL", yearLabel, 0));
        cycle.setCycleType(ReviewCycle.CycleType.ANNUAL);
        cycle.setYearLabel(yearLabel);
        cycle.setSequenceNo(0);
        cycle.setStartDate(start);
        cycle.setEndDate(end);
        cycle.setRequiresEmployeeSubmission(requiresSubmission);
        cycle.setRollupMethod(ReviewCycle.RollupMethod.AVERAGE);
        return cycle;
    }

    private ReviewCycle buildChild(TimeSetting setting, String yearLabel, LocalDate start, LocalDate end, int sequenceNo, int months) {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setTimeSetting(setting);
        cycle.setName(childName(yearLabel, sequenceNo, months));
        cycle.setCode(code(months == 3 ? "Q" : months == 6 ? "H" : "C", yearLabel, sequenceNo));
        cycle.setCycleType(months == 3
                ? ReviewCycle.CycleType.QUARTERLY
                : months == 6 ? ReviewCycle.CycleType.SEMI_ANNUAL : ReviewCycle.CycleType.CUSTOM);
        cycle.setYearLabel(yearLabel);
        cycle.setSequenceNo(sequenceNo);
        cycle.setStartDate(start);
        cycle.setEndDate(end);
        cycle.setRequiresEmployeeSubmission(true);
        return cycle;
    }

    private String childName(String yearLabel, int sequenceNo, int months) {
        if (months == 3 || months == 6) {
            return "Q" + sequenceNo + " " + yearLabel;
        }
        return "Cycle " + sequenceNo + " " + yearLabel;
    }

    private String code(String prefix, String yearLabel, int sequenceNo) {
        return (prefix + "-" + yearLabel + "-" + sequenceNo).replaceAll("[^A-Za-z0-9-]", "-").toUpperCase(Locale.ROOT);
    }

    private TimeSetting currentSetting() {
        TimeSetting setting = timeSettingRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            TimeSetting created = new TimeSetting();
            LocalDate start = getCurrentYearStart("Budget Year");
            created.setYearType("Budget Year");
            created.setDuration("6 Months");
            created.setPeriodType(TimeSetting.PeriodType.SEMI_ANNUAL);
            created.setStartDate(start);
            created.setEndDate(calculateEndDate(start, "6 Months"));
            return timeSettingRepository.save(created);
        });
        applyPendingYearTypeIfNextCycleDue(setting);
        return setting;
    }

    private void applyPendingYearTypeIfNextCycleDue(TimeSetting setting) {
        if (setting.getPendingYearType() == null || setting.getPendingYearType().isBlank() || setting.getEndDate() == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        if (!today.isAfter(setting.getEndDate())) {
            return;
        }
        setting.setYearType(setting.getPendingYearType());
        setting.setPendingYearType(null);
        LocalDate start = getCurrentYearStart(setting.getYearType());
        setting.setStartDate(start);
        setting.setEndDate(calculateEndDate(start, setting.getDuration()));
        timeSettingRepository.save(setting);
    }

    private LocalDate getCurrentYearStart(String yearType) {
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

    private ReviewCycleDto toDto(ReviewCycle cycle) {
        return toDto(cycle, LocalDate.now());
    }

    private ReviewCycleDto toDto(ReviewCycle cycle, LocalDate today) {
        String status = statusOf(cycle, today);
        return new ReviewCycleDto(
                cycle.getId(),
                cycle.getTimeSetting() != null ? cycle.getTimeSetting().getId() : null,
                cycle.getParentCycle() != null ? cycle.getParentCycle().getId() : null,
                cycle.getName(),
                cycle.getCode(),
                cycle.getCycleType().name(),
                cycle.getYearLabel(),
                cycle.getSequenceNo(),
                cycle.getStartDate(),
                cycle.getEndDate(),
                cycle.isRequiresEmployeeSubmission(),
                cycle.getRollupMethod() != null ? cycle.getRollupMethod().name() : null,
                status,
                "ACTIVE".equals(status),
                cycle.getCreatedAt(),
                cycle.getUpdatedAt()
        );
    }

    private String statusOf(ReviewCycle cycle, LocalDate today) {
        if (today.isBefore(cycle.getStartDate())) {
            return "UPCOMING";
        }
        if (today.isAfter(cycle.getEndDate())) {
            return "COMPLETED";
        }
        return "ACTIVE";
    }
}
