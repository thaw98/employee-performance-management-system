package com.epms.backend.service;

import com.epms.backend.dto.TimeSettingDto;
import com.epms.backend.entity.TimeSetting;
import com.epms.backend.repository.TimeSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class TimeSettingService {

    private final TimeSettingRepository repository;

    public TimeSettingService(TimeSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public TimeSettingDto getSettings() {
        return repository.findFirstByOrderByIdAsc()
                .map(this::toDto)
                .orElse(new TimeSettingDto("Calendar Year", LocalDate.now().withMonth(1).withDayOfMonth(1), LocalDate.now().withMonth(12).withDayOfMonth(31), "1 Year"));
    }

    @Transactional
    public TimeSettingDto saveSettings(TimeSettingDto dto) {
        TimeSetting setting = repository.findFirstByOrderByIdAsc().orElse(new TimeSetting());
        
        setting.setYearType(dto.getYearType());
        setting.setDuration(dto.getDuration());
        
        LocalDate start;
        if ("Budget Year".equals(dto.getYearType())) {
            start = LocalDate.now().withMonth(4).withDayOfMonth(1);
        } else {
            start = LocalDate.now().withMonth(1).withDayOfMonth(1);
        }
        
        setting.setStartDate(start);
        
        if (dto.getDuration().contains("Months")) {
            int months = Integer.parseInt(dto.getDuration().split(" ")[0]);
            setting.setEndDate(start.plusMonths(months).minusDays(1));
        } else if (dto.getDuration().contains("Year")) {
            setting.setEndDate(start.plusYears(1).minusDays(1));
        } else {
            setting.setEndDate(start.plusYears(1).minusDays(1));
        }
        
        TimeSetting saved = repository.save(setting);
        return toDto(saved);
    }

    private TimeSettingDto toDto(TimeSetting entity) {
        return new TimeSettingDto(
                entity.getYearType(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getDuration()
        );
    }
}
