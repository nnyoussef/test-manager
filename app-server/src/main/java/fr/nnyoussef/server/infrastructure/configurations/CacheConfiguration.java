package fr.nnyoussef.server.infrastructure.configurations;

import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;

import static com.github.benmanes.caffeine.cache.Caffeine.newBuilder;
import static java.util.function.Function.identity;

@Service
@Lazy
public class CacheConfiguration {

    @Bean
    public Cache<String, Object> getCache() {
        return newBuilder()
                .initialCapacity(100)
                .expireAfterWrite(Duration.ofHours(12))
                .maximumSize(100)
                .build();
    }

    @Bean
    public BiConsumer<String, Object> writeToCache(Cache<String, Object> cache) {
        return cache::put;
    }

    @Bean
    public Function<String, Object> fetchFromCache(Cache<String, Object> cache) {
        return key -> cache.get(key, identity());
    }

    @Bean
    public Consumer<String> removeFromCache(Cache<String, Object> cache) {
        return cache::invalidate;
    }
}
