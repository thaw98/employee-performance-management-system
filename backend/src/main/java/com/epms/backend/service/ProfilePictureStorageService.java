package com.epms.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfilePictureStorageService {

	public static final String PUBLIC_PATH_PREFIX = "/api/public/profile-pictures";

	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp");

	private static final long MAX_BYTES = 5L * 1024 * 1024;

	@Value("${epms.upload.profile-pictures-dir:uploads/profile-pictures}")
	private String uploadDir;

	public String store(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Image file is required");
		}
		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new IllegalArgumentException("Only JPEG, PNG, GIF, or WebP images are allowed");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new IllegalArgumentException("Image must be at most 5 MB");
		}
		String ext = extensionForContentType(contentType);
		String filename = UUID.randomUUID() + ext;
		Path dir = Path.of(uploadDir).toAbsolutePath().normalize();
		try {
			Files.createDirectories(dir);
			Path target = dir.resolve(filename);
			try (InputStream in = file.getInputStream()) {
				Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
			}
		} catch (IOException e) {
			throw new IllegalStateException("Could not save profile picture", e);
		}
		return PUBLIC_PATH_PREFIX + "/" + filename;
	}

	public void deleteIfStored(String profilePictureUrl) {
		if (profilePictureUrl == null || profilePictureUrl.isBlank()) {
			return;
		}
		String path = profilePictureUrl.trim();
		if (!path.startsWith(PUBLIC_PATH_PREFIX + "/")) {
			return;
		}
		String filename = path.substring((PUBLIC_PATH_PREFIX + "/").length());
		if (filename.isEmpty() || filename.indexOf('/') >= 0 || filename.contains("..")) {
			return;
		}
		Path dir = Path.of(uploadDir).toAbsolutePath().normalize();
		Path filePath = dir.resolve(filename).normalize();
		if (!filePath.startsWith(dir)) {
			return;
		}
		try {
			Files.deleteIfExists(filePath);
		} catch (IOException ignored) {
			// best-effort cleanup
		}
	}

	private static String extensionForContentType(String contentType) {
		String ct = contentType.toLowerCase(Locale.ROOT);
		return switch (ct) {
			case "image/jpeg" -> ".jpg";
			case "image/png" -> ".png";
			case "image/gif" -> ".gif";
			case "image/webp" -> ".webp";
			default -> ".bin";
		};
	}
}
