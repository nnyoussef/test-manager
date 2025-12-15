package fr.nnyoussef.server.infrastructure.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

import static java.lang.String.format;

@Configuration
public class WebFluxStaticResourceConfig implements WebFluxConfigurer {

    @Value("${resourcedir}")
    String resDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/files/**")
                .addResourceLocations(format("file:%s", resDir));
    }


}