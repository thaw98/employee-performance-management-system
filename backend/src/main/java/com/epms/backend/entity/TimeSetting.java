package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "time_settings")
@Getter
@Setter
@NoArgsConstructor
public class TimeSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "year_type", nullable = false)
    private String yearType;

    @Column(name = "pending_year_type")
    private String pendingYearType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "duration", nullable = false)
    private String duration;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type")
    private PeriodType periodType;

    public enum PeriodType {
        ANNUAL,
        SEMI_ANNUAL,
        BOTH
    }
}
