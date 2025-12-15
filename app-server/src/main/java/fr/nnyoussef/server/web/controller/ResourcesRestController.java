package fr.nnyoussef.server.web.controller;

import com.intuit.karate.core.Feature;
import fr.nnyoussef.server.infrastructure.functions.BaseFunction;
import fr.nnyoussef.server.web.response.BasicTestInfoResponse;
import fr.nnyoussef.server.web.response.factory.BasicTestInfoResponseFactory;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;

import static java.util.Comparator.comparing;
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

@RestController
@RequestMapping("/api/resources")
public final class ResourcesRestController extends BaseFunction {

    private final BasicTestInfoResponseFactory basicTestInfoResponseFactory;

    public ResourcesRestController(BeanFactory beanFactory,
                                   BasicTestInfoResponseFactory basicTestInfoResponseFactory) {
        super(beanFactory);
        this.basicTestInfoResponseFactory = basicTestInfoResponseFactory;

    }

    @GetMapping(
            value = "all-tests",
            produces = APPLICATION_JSON_VALUE)
    public Flux<BasicTestInfoResponse> getAllTests() {
        return Flux.fromStream(getAllFeaturesFilesPathSupplier())
                .map(Path::toFile)
                .map(Feature::read)
                .map(basicTestInfoResponseFactory::from)
                .sort((comparing(BasicTestInfoResponse::path)));
    }

    @GetMapping(
            value = "all-tests-details",
            produces = APPLICATION_JSON_VALUE
    )
    public Mono<Map<String, Object>> getAllTestsDetails(@RequestParam("from") String featurePath) {
        return Mono.just(featurePath)
                .map(getTestConfigurationsReaderFunction());
    }

    @GetMapping(value = "download/**")
    public Flux<DataBuffer> downloadFile(ServerWebExchange webExchange,
                                         @RequestParam("category") Optional<String> category,
                                         @RequestParam("fileExtension") Optional<String> fileExtension) {
        String filePath = webExchange.getRequest().getPath().pathWithinApplication().subPath(7).value();
        String modifiedFilePath = category
                .map(c -> "/" + c + "/" + filePath)
                .orElse(filePath);

        int dotIndex = modifiedFilePath.lastIndexOf('.');
        String modifiedFilePathAndExtension = (dotIndex != -1)
                ? fileExtension.isPresent() ? modifiedFilePath.substring(0, dotIndex) + "." + fileExtension.get():modifiedFilePath
                : modifiedFilePath + (filePath.isEmpty() ? "." : "/.") + fileExtension.orElse("txt");
        return getFileDownloadFunction().apply(modifiedFilePathAndExtension);
    }
}
