package fr.nnyoussef.server.infrastructure.functions;

import org.springframework.beans.factory.BeanFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static java.nio.file.Files.walk;
import static java.nio.file.Path.of;

@Service
public final class GetAllFeaturesFilesPathSupplier extends BaseFunction implements Supplier<Stream<? extends Path>> {

    public GetAllFeaturesFilesPathSupplier(BeanFactory beanFactory) {
        super(beanFactory);
    }

    @Override
    public Stream<? extends Path> get() {
        Path testSuitePath = of(getResDir(), "test-suites");
        try {
            return walk(testSuitePath)
                    .filter(path -> path.toString().contains(".feature"));
        } catch (IOException e) {
            return Stream.empty();
        }
    }

}
