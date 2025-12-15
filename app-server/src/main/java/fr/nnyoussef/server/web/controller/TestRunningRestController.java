package fr.nnyoussef.server.web.controller;

import fr.nnyoussef.server.infrastructure.functions.BaseFunction;
import fr.nnyoussef.server.web.response.FeatureRunnerRequestBody;
import fr.nnyoussef.server.web.response.TestRegistrationUuidTokenResponse;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;
import static org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE;
import static reactor.core.publisher.Mono.deferContextual;
import static reactor.core.publisher.Mono.just;
import static reactor.core.scheduler.Schedulers.parallel;

@RestController
@RequestMapping("/api/test-runner")
public final class TestRunningRestController extends BaseFunction {

    public TestRunningRestController(BeanFactory beanFactory) {
        super(beanFactory);
    }

    @PostMapping(
            produces = APPLICATION_JSON_VALUE,
            consumes = APPLICATION_JSON_VALUE,
            value = "/register"
    )
    public Mono<TestRegistrationUuidTokenResponse> registerForTestEventStream(@RequestBody FeatureRunnerRequestBody featureRunnerRequestBody) {
        return just(featureRunnerRequestBody)
                .handle(getRegisterForTestRunnerFunction())
                .flatMap(d -> deferContextual(contextView -> just(contextView.get("id").toString())))
                .map(TestRegistrationUuidTokenResponse::new)
                .contextWrite(Context.of("id", getRandomIdSupplier().get())).subscribeOn(parallel());
    }

    @GetMapping(
            value = "/run",
            produces = TEXT_EVENT_STREAM_VALUE
    )
    public Flux<ServerSentEvent<String>> runTest(@RequestParam("uuid") String uuid) {
        return just(uuid)
                .map(getTestRunnerInputDataFunction())
                .cast(FeatureRunnerRequestBody.class)
                .flatMapMany(getKarateFeatureRunnerFunction())
                .contextWrite(Context.of("id", uuid));
    }
}
