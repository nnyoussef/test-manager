package fr.nnyoussef.server.infrastructure.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringWebFluxTemplateEngine;
import org.thymeleaf.templateresolver.FileTemplateResolver;

import java.nio.file.Paths;

@Configuration
public class ThymeleafConfig {

    @Bean
    public FileTemplateResolver fileTemplateResolver(@Value("${resourcedir}") String resDir) {
        FileTemplateResolver resolver = new FileTemplateResolver();
        resolver.setPrefix(Paths.get(resDir, "ui").toString().concat("/"));
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCacheable(false);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);
        return resolver;
    }

    @Bean
    public SpringWebFluxTemplateEngine templateEngine(FileTemplateResolver resolver) {
        SpringWebFluxTemplateEngine engine = new SpringWebFluxTemplateEngine();
        engine.setTemplateResolver(resolver);
        engine.setEnableSpringELCompiler(true);
        return engine;
    }
}