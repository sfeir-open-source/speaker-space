package com.speakerspace.utils.date;

import com.speakerspace.dto.session.SessionScheduleImportDataDTO;
import lombok.experimental.UtilityClass;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@UtilityClass
public class EventDateCalculator {

    public static DateRange calculateEventDateRange(List<SessionScheduleImportDataDTO> sessions) {
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

        return (minStart != null && maxEnd != null) ?
                new DateRange(minStart, maxEnd) : null;
    }

    public record DateRange(Instant startDate, Instant endDate) {}
}
