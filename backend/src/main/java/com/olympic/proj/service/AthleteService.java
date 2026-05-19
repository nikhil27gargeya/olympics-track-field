package com.olympic.proj.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.olympic.proj.model.Athlete;
import com.olympic.proj.repository.AthleteRepository;

//contains business logic, namely for the REST API

@Service
public class AthleteService {
    private final AthleteRepository athleteRepository; 

    @Autowired
    public AthleteService(AthleteRepository athleteRepository) {
        this.athleteRepository = athleteRepository;
    }

    public List<Athlete> getAthletes() {
        return athleteRepository.findAll();
    }

    public List<Athlete> getAthletesByFilters(String city, String medal, String name) {
        return athleteRepository.findAll().stream()
            .filter(athlete -> city == null || city.isBlank() || athlete.getLocation().equalsIgnoreCase(city))
            .filter(athlete -> medal == null || medal.isBlank() || "all".equalsIgnoreCase(medal) || athlete.getMedal() != null && athlete.getMedal().equalsIgnoreCase(medal))
            .filter(athlete -> name == null || name.isBlank() || athlete.getName().toLowerCase().contains(name.toLowerCase()))
            .collect(Collectors.toList());
    }

    public List<Athlete> getAthletesFromNationality(String nationality) {
        return athleteRepository.findAll().stream()
            .filter(athlete -> athlete.getNationality().trim().equals(nationality))
            .collect(Collectors.toList());
    }

    public List<Athlete> getAthletesByName(String searchText) {
        return athleteRepository.findAll().stream()
            .filter(athlete -> athlete.getName().toLowerCase().contains(searchText.toLowerCase()))
            .collect(Collectors.toList());
    }

    public void saveAthlete(Athlete athlete) {
        athleteRepository.save(athlete);
    }

    public Optional<Athlete> getAthleteById(String id) {
        return athleteRepository.findById(id);
    }

    public Optional<Athlete> getAthleteByName(String name) {
        return athleteRepository.findByName(name);
    }

    public List<Athlete> getAthletesByMedalChar(String medal) {
    return athleteRepository.findAll().stream()
        .filter(athlete -> athlete.getMedal() != null && athlete.getMedal().contains(medal))
        .collect(Collectors.toList());
    }

    public List<Athlete> getAthletesByCity(String city) {
    return athleteRepository.findAll().stream()
            .filter(athlete -> athlete.getLocation().equalsIgnoreCase(city))
            .collect(Collectors.toList());
    }

    public List<Athlete> searchByName(String name) {
        return athleteRepository.findByNameContainingIgnoreCase(name);
    }
}
