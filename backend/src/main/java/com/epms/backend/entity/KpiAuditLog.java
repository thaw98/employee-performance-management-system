package com.epms.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "kpi_audit_logs")
public class KpiAuditLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "kpi_record_id")
	private Long kpiRecordId;

	@Column(name = "action", length = 100)
	private String action; // e.g., "WEIGHT_VALIDATION", "SUBMISSION", "DRAFT_SAVE"

	@Column(name = "details", columnDefinition = "TEXT")
	private String details;

	@Column(name = "performed_by")
	private String performedBy;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;
}
