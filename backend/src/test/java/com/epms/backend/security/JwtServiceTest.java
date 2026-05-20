package com.epms.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;

import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

class JwtServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    @Test
    void generateTokenOmitsExpirationClaim() {
        JwtService jwtService = new JwtService(SECRET);
        User user = new User();
        user.setId(42L);
        Role role = new Role();
        role.setName("HR");
        user.setRole(role);

        String token = jwtService.generateToken(user);
        SecretKey signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertEquals("42", claims.getSubject());
        assertEquals("HR", claims.get("role", String.class));
        assertNull(claims.getExpiration());
        assertNull(jwtService.calculateExpirationInstant());
    }
}
