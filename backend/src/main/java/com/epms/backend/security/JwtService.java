package com.epms.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.epms.backend.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey signingKey;

	public JwtService(@Value("${jwt.secret}") String secret) {
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
	}

	public String generateToken(User user) {
		Date now = new Date();
		return Jwts.builder()
				.subject(String.valueOf(user.getId()))
				.claim("role", user.getRole().getName())
				.issuedAt(now)
				.signWith(signingKey)
				.compact();
	}

	public Instant calculateExpirationInstant() {
		return null;
	}

	public String extractSubject(String token) throws JwtException {
		Claims claims = Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
		return claims.getSubject();
	}
}
