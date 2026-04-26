package com.epms.backend.config;

import com.epms.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Arrays;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String USER_ID_ATTRIBUTE = "userId";

    private final JwtService jwtService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://127.0.0.1:5173")
                .addInterceptors(new JwtHandshakeInterceptor(jwtService))
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(
                            ServerHttpRequest request,
                            WebSocketHandler wsHandler,
                            Map<String, Object> attributes) {
                        String userId = (String) attributes.get(USER_ID_ATTRIBUTE);
                        return userId == null ? null : () -> userId;
                    }
                });
    }

    private static final class JwtHandshakeInterceptor implements HandshakeInterceptor {
        private final JwtService jwtService;

        private JwtHandshakeInterceptor(JwtService jwtService) {
            this.jwtService = jwtService;
        }

        @Override
        public boolean beforeHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Map<String, Object> attributes) {
            String token = extractQueryParam(request, "token");
            if (token == null || token.isBlank()) {
                return false;
            }

            try {
                attributes.put(USER_ID_ATTRIBUTE, jwtService.extractSubject(token));
                return true;
            } catch (Exception ex) {
                return false;
            }
        }

        @Override
        public void afterHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Exception exception) {
        }

        private static String extractQueryParam(ServerHttpRequest request, String name) {
            String query = request.getURI().getRawQuery();
            if (query == null || query.isBlank()) {
                return null;
            }

            return Arrays.stream(query.split("&"))
                    .map(param -> param.split("=", 2))
                    .filter(parts -> parts.length == 2 && parts[0].equals(name))
                    .map(parts -> URLDecoder.decode(parts[1], StandardCharsets.UTF_8))
                    .findFirst()
                    .orElse(null);
        }
    }
}
