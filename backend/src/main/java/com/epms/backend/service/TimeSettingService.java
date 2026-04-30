package com.epms.backend.service;

import com.epms.backend.dto.PeriodDto;
import com.epms.backend.dto.TimeSettingDto;
import com.epms.backend.entity.Period;
import com.epms.backend.entity.TimeSetting;
import com.epms.backend.repository.PeriodRepository;
import com.epms.backend.repository.TimeSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.time.LocalDate;

@Service
public class TimeSettingService {

    private final TimeSettingRepository repository;
    private final PeriodRepository periodRepository;

    public TimeSettingService(TimeSettingRepository repository, PeriodRepository periodRepository) {
        this.repository = repository;
        this.periodRepository = periodRepository;
    }

    @Transactional(readOnly = true)
    public TimeSettingDto getSettings() {
        return repository.findFirstByOrderByIdAsc()
                .map(this::toDto)
                .orElseGet(this::defaultSettings);
    }

    @Transactional
    public TimeSettingDto saveSettings(TimeSettingDto dto) {
        TimeSetting setting = repository.findFirstByOrderByIdAsc().orElse(new TimeSetting());
        
        setting.setYearType(dto.getYearType());
        TimeSetting.PeriodType periodType = resolvePeriodType(dto);
        setting.setPeriodType(periodType);
        setting.setDuration(periodType == TimeSetting.PeriodType.BOTH ? "Both" : dto.getDuration());
        
        LocalDate start = getYearStart(dto.getYearType());
        
        setting.setStartDate(start);
        
        if (periodType == TimeSetting.PeriodType.BOTH || periodType == TimeSetting.PeriodType.ANNUAL) {
            setting.setEndDate(start.plusYears(1).minusDays(1));
        } else if (dto.getDuration().contains("Months")) {
            int months = Integer.parseInt(dto.getDuration().split(" ")[0]);
            setting.setEndDate(start.plusMonths(months).minusDays(1));
        } else {
            setting.setEndDate(start.plusYears(1).minusDays(1));
        }
        
        TimeSetting saved = repository.save(setting);
        replacePeriods(saved);
        return toDto(saved);
    }

    private TimeSettingDto toDto(TimeSetting entity) {
        List<Period> periods = periodRepository.findByTimeSettingIdOrderByStartDateAscPeriodTypeAsc(entity.getId());
        if (periods.isEmpty()) {
            periods = generatePeriods(entity);
        }

        return new TimeSettingDto(
                entity.getYearType(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getDuration(),
                entity.getPeriodType() != null ? entity.getPeriodType().name() : null,
                periods.stream().map(this::toPeriodDto).toList()
        );
    }

    private TimeSettingDto defaultSettings() {
        LocalDate start = LocalDate.now().withMonth(1).withDayOfMonth(1);
        LocalDate end = start.plusYears(1).minusDays(1);
        Period period = buildPeriod("Annual", start, end, Period.PeriodType.ANNUAL, null);
        return new TimeSettingDto("Calendar Year", start, end, "1 Year", TimeSetting.PeriodType.ANNUAL.name(), List.of(toPeriodDto(period)));
    }

    private void replacePeriods(TimeSetting setting) {
        periodRepository.deleteByTimeSettingId(setting.getId());
        periodRepository.saveAll(generatePeriods(setting));
    }

    private List<Period> generatePeriods(TimeSetting setting) {
        List<Period> periods = new ArrayList<>();
        TimeSetting.PeriodType periodType = setting.getPeriodType() != null ? setting.getPeriodType() : resolvePeriodType(setting.getDuration());
        LocalDate start = setting.getStartDate();
        LocalDate annualEnd = start.plusYears(1).minusDays(1);

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

    private LocalDate getYearStart(String yearType) {
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
}
