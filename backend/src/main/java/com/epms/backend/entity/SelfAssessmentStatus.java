package com.epms.backend.entity;

public enum SelfAssessmentStatus {
    DRAFT,
    SUBMITTED, // Employee signed
    MANAGER_REVIEWED, // Manager signed
    COMPLETED // HR signed
}
