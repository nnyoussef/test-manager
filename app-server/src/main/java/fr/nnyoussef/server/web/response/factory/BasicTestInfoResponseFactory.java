package fr.nnyoussef.server.web.response.factory;

import com.intuit.karate.core.Feature;
import fr.nnyoussef.server.infrastructure.functions.BaseFunction;
import fr.nnyoussef.server.web.response.BasicTestInfoResponse;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

import static java.nio.file.Path.of;

@Component
@Lazy
public final class BasicTestInfoResponseFactory extends BaseFunction {

    public BasicTestInfoResponseFactory(BeanFactory beanFactory) {
        super(beanFactory);
    }

    public BasicTestInfoResponse from(Feature feature) {
        Path testSuitePath = of(getResDir(), "test-suites").toAbsolutePath();
        Path featureDir = feature.getResource()
                .getFile()
                .toPath();

        Path featureDirRelativeToTestSuite = testSuitePath.relativize(featureDir);

        return new BasicTestInfoResponse(
                feature.getName(),
                featureDirRelativeToTestSuite.toString()
        );
    }

}
