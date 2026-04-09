package com.epms.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "kpi_revisions")
public class KpiRevision {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "kpi_record_id", nullable = false)
	private KpiRecord kpiRecord;

	@Column(name = "previous_kpi")
	private String previousKpi;

	@Column(name = "previous_target")
	private String previousTarget;

	@Column(name = "previous_weight")
	private Double previousWeight;

	@Column(name = "revised_by")
	private Long revisedBy;

	@CreationTimestamp
	@Column(name = "revised_at", updatable = false)
	private LocalDateTime revisedAt;

	@Column(name = "revision_note", length = 500)
	private String revisionNote;
}
