package com.epms.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

//MNA
@Getter
@Setter
@Entity
@Table(name = "kpi_records")
public class KpiRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "employee_id", nullable = false)
	private Employee employee;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "manager_id")
	private Employee manager;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "period_id", nullable = false)
	private KpiPeriod period;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "template_id")
	private KpiTemplate template;

	@Column(name = "kpi", length = 255, nullable = false)
	private String kpi;

	@Column(name = "category", length = 100)
	private String category;

	@Column(name = "logic_direction", length = 20) // "higher" or "lower"
	private String logicDirection;

	@Column(name = "target", length = 255)
	private String target;

	@Column(name = "unit", length = 100)
	private String unit;

	@Column(name = "actual", length = 255)
	private String actual;

	@Column(name = "weight")
	private Double weight;

	@Column(name = "score")
	private Double score;

	@Column(name = "weighted_score")
	private Double weightedScore;

	@Column(name = "dynamic_data", columnDefinition = "JSON")
	private String dynamicData;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", length = 50)
	private KpiStatus status;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
}
