package fr.nnyoussef.server.infrastructure.functions;

import fr.nnyoussef.server.core.domain.UiRenderingRequest;
import org.reactivestreams.Publisher;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.util.Locale;
import java.util.function.BiFunction;

import static java.nio.charset.Charset.defaultCharset;
import static java.nio.file.Path.of;
import static java.nio.file.StandardOpenOption.*;
import static org.springframework.http.MediaType.TEXT_HTML;

@Service
@Lazy
public final class UiRenderFunction extends BaseFunction implements BiFunction<UiRenderingRequest, String, Mono<String>> {

    private static final DefaultDataBufferFactory DEFAULT_DATA_BUFFER_FACTORY = new DefaultDataBufferFactory(true, 208_896);//204KB
    private static final String OUTPUT_FILE_NAME_FORMAT = "output/%s.html";

    public UiRenderFunction(BeanFactory beanFactory) {
        super(beanFactory);
    }

    @Override
    public Mono<String> apply(UiRenderingRequest uiRenderingRequest,
                              String outputId) {
        String templateName = uiRenderingRequest.templateName();
        Context context = new Context(Locale.getDefault(), uiRenderingRequest.variables());

        String fileName = OUTPUT_FILE_NAME_FORMAT.formatted(outputId);
        Path outputPath = of(getResDir(), fileName);

        getSpringWebFluxTemplateEngine().clearTemplateCacheFor(templateName);

        Publisher<DataBuffer> dataBufferPublisher = getSpringWebFluxTemplateEngine().processStream(
                templateName,
                null,
                context,
                DEFAULT_DATA_BUFFER_FACTORY,
                TEXT_HTML,
                defaultCharset()
        );


        return DataBufferUtils.write(
                        dataBufferPublisher,
                        outputPath,
                        CREATE,
                        TRUNCATE_EXISTING,
                        SPARSE)
                .then(Mono.fromCallable(() ->  fileName));
    }
}
