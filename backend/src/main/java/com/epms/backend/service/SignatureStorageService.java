package com.epms.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SignatureStorageService {

    public static final String PUBLIC_PATH_PREFIX = "/uploads/signatures";

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
            "image/svg+xml");

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final String PNG_DATA_URL_PREFIX = "data:image/png;base64,";

    @Value("${epms.upload.signatures-dir:uploads/signatures}")
    private String uploadDir;

    public String storeDrawnPng(String signaturePngDataUrl) {
        if (signaturePngDataUrl == null || signaturePngDataUrl.isBlank()) {
            throw new IllegalArgumentException("Signature image is required");
        }
        String trimmed = signaturePngDataUrl.trim();
        if (!trimmed.toLowerCase(Locale.ROOT).startsWith(PNG_DATA_URL_PREFIX)) {
            throw new IllegalArgumentException("Drawn signatures must be PNG images");
        }

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(trimmed.substring(PNG_DATA_URL_PREFIX.length()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Signature image data is invalid");
        }
        if (bytes.length == 0) {
            throw new IllegalArgumentException("Signature image is required");
        }
        if (bytes.length > MAX_BYTES) {
            throw new IllegalArgumentException("Signature image must be at most 5 MB");
        }

        return writeBytes(bytes, UUID.randomUUID() + ".png");
    }

    public String storeUploadedImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Signature image file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Signature image must be at most 5 MB");
        }

        String filename = UUID.randomUUID() + extensionForContentType(contentType, file.getOriginalFilename());
        Path dir = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalArgumentException("Invalid signature filename");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not save signature image", e);
        }
        return PUBLIC_PATH_PREFIX + "/" + filename;
    }

    private String writeBytes(byte[] bytes, String filename) {
        Path dir = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalArgumentException("Invalid signature filename");
            }
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Could not save signature image", e);
        }
        return PUBLIC_PATH_PREFIX + "/" + filename;
    }

    private static String extensionForContentType(String contentType, String originalFilename) {
        String ct = contentType.toLowerCase(Locale.ROOT);
        return switch (ct) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "image/bmp" -> ".bmp";
            case "image/svg+xml" -> ".svg";
            default -> safeOriginalExtension(originalFilename);
        };
    }

    private static String safeOriginalExtension(String originalFilename) {
        if (originalFilename == null) {
            return ".img";
        }
        String filename = Path.of(originalFilename).getFileName().toString();
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return ".img";
        }
        String ext = filename.substring(dot).toLowerCase(Locale.ROOT);
        return ext.matches("\\.[a-z0-9]{1,10}") ? ext : ".img";
    }
}
