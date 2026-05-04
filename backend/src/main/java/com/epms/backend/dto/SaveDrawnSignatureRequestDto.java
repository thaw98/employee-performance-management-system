package com.epms.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SaveDrawnSignatureRequestDto {

    @NotBlank(message = "Signature image is required")
    private String signaturePngDataUrl;

    public String getSignaturePngDataUrl() {
        return signaturePngDataUrl;
    }

    public void setSignaturePngDataUrl(String signaturePngDataUrl) {
        this.signaturePngDataUrl = signaturePngDataUrl;
    }
}
