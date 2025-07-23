package com.speakerspace.service;

import com.speakerspace.dto.session.SessionScheduleImportDataDTO;
import com.speakerspace.model.Pair;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Service
@Component
public class TimeZoneService {

    public Pair<Instant, Instant> calculateEventDateRange(List<SessionScheduleImportDataDTO> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            return null;
        }

        Instant minStart = sessions.stream()
                .map(SessionScheduleImportDataDTO::start)
                .filter(Objects::nonNull)
                .map(Date::toInstant)
                .min(Instant::compareTo)
                .orElse(null);

        Instant maxEnd = sessions.stream()
                .map(SessionScheduleImportDataDTO::end)
                .filter(Objects::nonNull)
                .map(Date::toInstant)
                .max(Instant::compareTo)
                .orElse(null);

        return minStart != null && maxEnd != null ? Pair.of(minStart, maxEnd) : null;
    }
}
