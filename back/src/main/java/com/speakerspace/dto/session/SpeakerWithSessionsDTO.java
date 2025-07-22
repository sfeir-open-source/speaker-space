package com.speakerspace.dto.session;

import com.speakerspace.model.session.Category;
import com.speakerspace.model.session.Format;
import com.speakerspace.model.session.SessionReviewImportData;
import com.speakerspace.model.session.Speaker;
import lombok.Builder;

import java.util.*;
import java.util.stream.Collectors;

@Builder
public record SpeakerWithSessionsDTO(
        Speaker speaker,
        List<SessionReviewImportData> sessions,
        Set<Format> formats,
        Set<Category> categories
) {

    public SpeakerWithSessionsDTO {
        Objects.requireNonNull(speaker, "Speaker cannot be null");

        sessions = sessions != null ? new ArrayList<>(sessions) : new ArrayList<>();

        var extractedData = extractFormatsAndCategories(sessions);
        formats = extractedData.formats();
        categories = extractedData.categories();
    }

    public SpeakerWithSessionsDTO(Speaker speaker, List<SessionReviewImportData> sessions) {
        this(speaker, sessions, null, null);
    }

    public static SpeakerWithSessionsDTO of(Speaker speaker, List<SessionReviewImportData> sessions) {
        return new SpeakerWithSessionsDTO(speaker, sessions);
    }

    private static ExtractedData extractFormatsAndCategories(List<SessionReviewImportData> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            return new ExtractedData(Set.of(), Set.of());
        }

        Set<Format> extractedFormats = sessions.stream()
                .filter(Objects::nonNull)
                .map(SessionReviewImportData::getFormats)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Category> extractedCategories = sessions.stream()
                .filter(Objects::nonNull)
                .map(SessionReviewImportData::getCategories)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return new ExtractedData(extractedFormats, extractedCategories);
    }

    public SpeakerWithSessionsDTO withSessions(List<SessionReviewImportData> newSessions) {
        return new SpeakerWithSessionsDTO(this.speaker, newSessions);
    }

    public SpeakerWithSessionsDTO withSpeaker(Speaker newSpeaker) {
        return new SpeakerWithSessionsDTO(newSpeaker, this.sessions);
    }

    private record ExtractedData(Set<Format> formats, Set<Category> categories) {}
}
