package com.epms.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

//MNA
@Getter
@Setter
@Entity
@Table(name = "kpi_periods")
public class KpiPeriod {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "name", length = 100, nullable = false)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "period_type", length = 30)
	private PeriodType periodType;

	@Column(name = "start_date")
	private LocalDate startDate;

	@Column(name = "end_date")
	private LocalDate endDate;

	@Column(name = "review_start_date")
	private LocalDate reviewStartDate;

	@Column(name = "review_end_date")
	private LocalDate reviewEndDate;

	@Column(name = "is_active")
	private Boolean isActive;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
}
