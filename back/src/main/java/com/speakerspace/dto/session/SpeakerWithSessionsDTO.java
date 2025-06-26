package com.speakerspace.dto.session;

import com.speakerspace.model.session.Category;
import com.speakerspace.model.session.Format;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;

import java.util.*;
import java.util.stream.Collectors;

public class SpeakerWithSessionsDTO {
    private Speaker speaker;
    private List<SessionImportData> sessions;
    private Set<Format> formats;
    private Set<Category> categories;

    public SpeakerWithSessionsDTO(Speaker speaker, List<SessionImportData> sessions) {
        this.speaker = speaker;
        this.sessions = sessions != null ? sessions : new ArrayList<>();
        this.extractFormatsAndCategories();
    }

    private void extractFormatsAndCategories() {
        this.formats = new HashSet<>();
        this.categories = new HashSet<>();

        if (this.sessions != null) {
            this.formats = this.sessions.stream()
                    .filter(session -> session.getFormats() != null)
                    .flatMap(session -> session.getFormats().stream())
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            this.categories = this.sessions.stream()
                    .filter(session -> session.getCategories() != null)
                    .flatMap(session -> session.getCategories().stream())
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
        }
    }

    public Speaker getSpeaker() {
        return speaker;
    }

    public void setSpeaker(Speaker speaker) {
        this.speaker = speaker;
    }

    public List<SessionImportData> getSessions() {
        return sessions;
    }

    public void setSessions(List<SessionImportData> sessions) {
        this.sessions = sessions != null ? sessions : new ArrayList<>();
        this.extractFormatsAndCategories();
    }

    public Set<Format> getFormats() {
        return formats;
    }

    public void setFormats(Set<Format> formats) {
        this.formats = formats != null ? formats : new HashSet<>();
    }

    public Set<Category> getCategories() {
        return categories;
    }

    public void setCategories(Set<Category> categories) {
        this.categories = categories != null ? categories : new HashSet<>();
    }
}