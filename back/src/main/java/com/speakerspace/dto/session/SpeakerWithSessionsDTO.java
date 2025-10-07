package com.speakerspace.dto.session;

import com.speakerspace.model.session.Category;
import com.speakerspace.model.session.Format;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;
import lombok.Builder;

import java.util.*;
import java.util.stream.Collectors;

@Builder
public record SpeakerWithSessionsDTO(
        Speaker speaker,
        List<SessionImportData> sessions,
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

    public SpeakerWithSessionsDTO(Speaker speaker, List<SessionImportData> sessions) {
        this(speaker, sessions, null, null);
    }

    public static SpeakerWithSessionsDTO of(Speaker speaker, List<SessionImportData> sessions) {
        return new SpeakerWithSessionsDTO(speaker, sessions);
    }

    private static ExtractedData extractFormatsAndCategories(List<SessionImportData> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            return new ExtractedData(Set.of(), Set.of());
        }

        Set<Format> extractedFormats = sessions.stream()
                .filter(Objects::nonNull)
                .map(SessionImportData::getFormats)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Category> extractedCategories = sessions.stream()
                .filter(Objects::nonNull)
                .map(SessionImportData::getCategories)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return new ExtractedData(extractedFormats, extractedCategories);
    }

    private record ExtractedData(Set<Format> formats, Set<Category> categories) {}
}
