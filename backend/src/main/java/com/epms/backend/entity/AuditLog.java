package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "audit_id")
	private Long id;

	@Column(name = "action_type", nullable = false, length = 100)
	private String actionType;

	@Column(name = "target_type", nullable = false, length = 100)
	private String targetType;

	@Column(name = "target_id")
	private Long targetId;

	@Column(name = "performed_by_user_id")
	private Long performedByUserId;

	@Column(name = "performed_by_role_id")
	private Long performedByRoleId;

	@Column(name = "description", nullable = false, columnDefinition = "TEXT")
	private String description;

	@Column(name = "metadata_json", columnDefinition = "JSON")
	private String metadataJson;

	@Column(name = "before_data", columnDefinition = "LONGTEXT")
	private String beforeData;

	@Column(name = "after_data", columnDefinition = "LONGTEXT")
	private String afterData;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();
}
