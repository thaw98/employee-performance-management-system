package com.epms.backend.dto;

import java.time.LocalDateTime;

import com.epms.backend.entity.Signature;

public record SignatureDto(
        Long id,
        String signatureData,
        String signatureType,
        String name,
        boolean isDefault,
        LocalDateTime createdAt) {

    public static SignatureDto from(Signature signature) {
        if (signature == null) {
            return null;
        }
        return new SignatureDto(
                signature.getId(),
                signature.getSignatureData(),
                signature.getSignatureType(),
                signature.getName(),
                signature.isDefault(),
                signature.getCreatedAt());
    }
}
