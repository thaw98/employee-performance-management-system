package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private String actionType;
    private String targetType;
    private Long targetId;
    private Long performedByUserId;
    private String performedByUserName;
    private String description;
    private String metadataJson;
    private String beforeData;
    private String afterData;
    private Instant createdAt;
}
