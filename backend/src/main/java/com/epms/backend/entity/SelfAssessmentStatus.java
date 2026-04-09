package com.epms.backend.entity;

public enum SelfAssessmentStatus {
    UNLOCKED,  // Employee can edit
    LOCKED,    // Submitted, waiting for HR/Manager (Employee cannot edit)
    FINALIZED  // Fully approved (No one can edit)
}
