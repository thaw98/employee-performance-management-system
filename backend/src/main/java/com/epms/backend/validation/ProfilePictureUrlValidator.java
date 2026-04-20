package com.epms.backend.validation;

import com.epms.backend.service.ProfilePictureStorageService;

public final class ProfilePictureUrlValidator {

	private static final int MAX_LEN = 2048;

	private ProfilePictureUrlValidator() {
	}

	/**
	 * Accepts http(s) URLs or paths produced by {@link ProfilePictureStorageService}.
	 */
	public static String normalizeOrNull(String value) {
		if (value == null) {
			return null;
		}
		String t = value.trim();
		if (t.isEmpty()) {
			return null;
		}
		if (t.startsWith("data:")) {
			throw new IllegalArgumentException("Profile picture must be a URL, not embedded image data");
		}
		if (t.length() > MAX_LEN) {
			throw new IllegalArgumentException("Profile picture URL is too long");
		}
		if (t.startsWith("http://") || t.startsWith("https://")) {
			return t;
		}
		if (t.startsWith(ProfilePictureStorageService.PUBLIC_PATH_PREFIX + "/")) {
			return t;
		}
		throw new IllegalArgumentException("Profile picture must be an http(s) URL or a path under "
				+ ProfilePictureStorageService.PUBLIC_PATH_PREFIX + "/");
	}
}
