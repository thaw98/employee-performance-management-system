package com.epms.backend.util;

import java.util.Locale;

import com.epms.backend.entity.Gender;

/**
 * Normalizes person display names: trim, collapse whitespace, title-case each word.
 * e.g. {@code "Khant  ko Ko"} → {@code "Khant Ko Ko"}.
 */
public final class PersonNameNormalizer {

	private PersonNameNormalizer() {
	}

	public static String normalize(String raw) {
		if (raw == null) {
			return "";
		}
		String collapsed = raw.trim().replaceAll("\\s+", " ");
		if (collapsed.isEmpty()) {
			return "";
		}
		String[] parts = collapsed.split(" ");
		StringBuilder sb = new StringBuilder(collapsed.length());
		for (String part : parts) {
			if (part.isEmpty()) {
				continue;
			}
			if (sb.length() > 0) {
				sb.append(' ');
			}
			sb.append(titleCaseWord(part));
		}
		return sb.toString();
	}

	public static String normalizeEmployeeName(String raw, Gender gender) {
		String normalized = normalize(raw);
		if (normalized.isEmpty() || hasTitlePrefix(normalized) || gender == null) {
			return normalized;
		}
		String title = gender == Gender.Male ? "U" : "Daw";
		return title + " " + normalized;
	}

	private static boolean hasTitlePrefix(String name) {
		String lower = name.toLowerCase(Locale.ROOT);
		return lower.startsWith("u ") || lower.startsWith("daw ");
	}

	private static String titleCaseWord(String word) {
		int cp = word.codePointAt(0);
		String first = new String(Character.toChars(Character.toTitleCase(cp)));
		int count = Character.charCount(cp);
		if (word.length() <= count) {
			return first;
		}
		String rest = word.substring(count).toLowerCase(Locale.ROOT);
		return first + rest;
	}
}
