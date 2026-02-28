package com.pokertrainer.backend.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors-origins:http://localhost:5173,https://*.vercel.app}")
    private String corsOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> originPatterns = Arrays.stream(corsOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .toList();

        registry.addMapping("/api/**")
            .allowedOriginPatterns(originPatterns.toArray(String[]::new))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
