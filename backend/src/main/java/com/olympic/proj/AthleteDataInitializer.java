package com.olympic.proj;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.olympic.proj.model.Athlete;
import com.olympic.proj.repository.AthleteRepository;

@Component
public class AthleteDataInitializer implements CommandLineRunner {
    private static final Pattern QUOTED_CSV_FIELD = Pattern.compile("\"([^\"]*)\"");
    private static final String RESULTS_DATASET = "results.csv";

    private static final int ID = 0;
    private static final int GENDER = 1;
    private static final int EVENT = 2;
    private static final int LOCATION = 3;
    private static final int YEAR = 4;
    private static final int MEDAL = 5;
    private static final int NAME = 6;
    private static final int NATIONALITY = 7;
    private static final int RESULT = 8;
    private static final int REQUIRED_FIELD_COUNT = 9;

    private final AthleteRepository athleteRepository;

    public AthleteDataInitializer(AthleteRepository athleteRepository) {
        this.athleteRepository = athleteRepository;
    }

    @Override
    public void run(String... args) throws IOException {
        List<Athlete> athletes = loadAthletes();
        long existingAthleteCount = athleteRepository.count();

        if (existingAthleteCount >= athletes.size()) {
            return;
        }

        athleteRepository.deleteAll();
        athleteRepository.saveAll(athletes);
    }

    private List<Athlete> loadAthletes() throws IOException {
        List<Athlete> athletes = new ArrayList<>();
        ClassPathResource dataset = new ClassPathResource(RESULTS_DATASET);

        try (InputStream inputStream = dataset.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            reader.readLine();

            String row;
            while ((row = reader.readLine()) != null) {
                parseAthlete(row).ifPresent(athletes::add);
            }
        }

        return athletes;
    }

    private Optional<Athlete> parseAthlete(String row) {
        List<String> fields = parseQuotedCsvFields(row);
        if (fields.size() != REQUIRED_FIELD_COUNT) {
            return Optional.empty();
        }

        return Optional.of(new Athlete(
                fields.get(ID),
                fields.get(GENDER),
                fields.get(EVENT),
                fields.get(LOCATION),
                fields.get(YEAR),
                fields.get(MEDAL),
                fields.get(NAME),
                fields.get(NATIONALITY),
                fields.get(RESULT)));
    }

    private List<String> parseQuotedCsvFields(String row) {
        List<String> fields = new ArrayList<>();
        Matcher matcher = QUOTED_CSV_FIELD.matcher(row);
        while (matcher.find()) {
            fields.add(matcher.group(1).replace("\r", "").trim());
        }
        return fields;
    }
}
