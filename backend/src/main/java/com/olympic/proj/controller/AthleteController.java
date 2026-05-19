package com.olympic.proj.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.olympic.proj.model.Athlete;
import com.olympic.proj.service.AthleteService;

import org.springframework.web.bind.annotation.RequestParam;

//controller class that handles HTTP requests for the REST API

@RestController
public class AthleteController {
    private final AthleteService athleteService;

    //delegates business logic to the service layer
    @Autowired
    public AthleteController(AthleteService athleteService) {
        this.athleteService = athleteService;
    }

    @GetMapping("/athletes")
    public List<Athlete> findAll() {
        return athleteService.getAthletes();
    }

    @GetMapping("/athletes/{id}")
    public ResponseEntity<Athlete> getAthleteById(@PathVariable String id) {
        return athleteService.getAthleteById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/athletes/name")
    public ResponseEntity<Athlete> getAthleteByName(@RequestParam String name) {
        return athleteService.getAthleteByName(name)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/athletes/search")
    public List<Athlete> search(@RequestParam String name) {
        return athleteService.searchByName(name);
    }  

    @GetMapping("/athletes/filter")
    public List<Athlete> filterAthletes(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String medal,
            @RequestParam(required = false) String name) {
        return athleteService.getAthletesByFilters(city, medal, name);
    }

    @PostMapping("/athletes")
    public String createAthlete(@RequestBody Athlete athlete) {
        athleteService.saveAthlete(athlete);
        return "Athlete added";
    }

    @GetMapping("/athletes/nationality")
    public List<Athlete> getByNationality(@RequestParam String nationality) {
        return athleteService.getAthletesFromNationality(nationality);
    }

    @GetMapping("/athletes/medal")
    public List<Athlete> getAthleteByMedal(@RequestParam String medal) {
        switch (medal.toUpperCase()) {
            case "G":
                return athleteService.getAthletesByMedalChar("G");
            case "S":
                return athleteService.getAthletesByMedalChar("S");
            case "B":
            return athleteService.getAthletesByMedalChar("B");
            default:
            throw new IllegalArgumentException("Invalid medal type");
        }
    }

    @GetMapping("/athletes/city")
    public List<Athlete> getAthletesByCity(@RequestParam String city) {
        return athleteService.getAthletesByCity(city);
    }

}

/*

GET /athletes: get all athletes
GET /athletes/{id}: get a specific athlete by ID
POST /athletes: create a new athlete
DELETE /athletes/{id}
PUT /athletes/{id}
GET /athletes/nationality

*/
