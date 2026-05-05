package com.epms.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(PublicProfilePictureController.PUBLIC_BASE)
public class PublicProfilePictureController {

	static final String PUBLIC_BASE = "/api/public/profile-pictures";

	@Value("${epms.upload.profile-pictures-dir:uploads/profile-pictures}")
	private String uploadDir;

	@GetMapping("/{filename:.+}")
	public ResponseEntity<Resource> get(@PathVariable String filename) {
		if (filename == null || filename.isEmpty() || filename.contains("..") || filename.indexOf('/') >= 0) {
			return ResponseEntity.notFound().build();
		}
		Path filePath = resolveExistingFile(filename);
		if (filePath == null) {
			return ResponseEntity.notFound().build();
		}
		FileSystemResource resource = new FileSystemResource(filePath);
		String contentType = probeContentType(filePath);
		return ResponseEntity.ok()
				.header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
				.contentType(MediaType.parseMediaType(contentType))
				.body(resource);
	}

	private Path resolveExistingFile(String filename) {
		List<Path> candidates = List.of(
				Path.of(uploadDir).toAbsolutePath().normalize(),
				Path.of("uploads/profile-pictures").toAbsolutePath().normalize(),
				Path.of("backend/uploads/profile-pictures").toAbsolutePath().normalize());
		for (Path dir : candidates) {
			Path filePath = dir.resolve(filename).normalize();
			if (filePath.startsWith(dir) && Files.isRegularFile(filePath)) {
				return filePath;
			}
		}
		return null;
	}

	private static String probeContentType(Path filePath) {
		try {
			String ct = Files.probeContentType(filePath);
			return ct != null ? ct : MediaType.APPLICATION_OCTET_STREAM_VALUE;
		} catch (IOException e) {
			return MediaType.APPLICATION_OCTET_STREAM_VALUE;
		}
	}
}
