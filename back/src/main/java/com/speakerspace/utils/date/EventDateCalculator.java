package com.speakerspace.utils.date;

import com.speakerspace.dto.session.SessionScheduleImportDataDTO;
import lombok.experimental.UtilityClass;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@UtilityClass
public class EventDateCalculator {

    public static DateRange calculateEventDateRange(List<SessionScheduleImportDataDTO> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            return null;
        }

        Instant minStart = sessions.stream()
                .map(SessionScheduleImportDataDTO::start)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .map(ldt -> ldt.atZone(ZoneId.of("Europe/Paris")).toInstant())
                .orElse(null);

        Instant maxEnd = sessions.stream()
                .map(SessionScheduleImportDataDTO::end)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .map(ldt -> ldt.atZone(ZoneId.of("Europe/Paris")).toInstant())
                .orElse(null);

        return (minStart != null && maxEnd != null) ?
                new DateRange(minStart, maxEnd) : null;
    }

    public record DateRange(Instant startDate, Instant endDate) {}



    public static Date convertLocalDateTimeToDate(LocalDateTime toConvert, ZoneId zoneId) {
        return Optional.ofNullable(toConvert)
                .map(localDateTime -> localDateTime.atZone(zoneId))
                .map(ZonedDateTime::toInstant)
                .map(Date::from)
                .orElse(null);
    }

    public static LocalDateTime convertLocalDateTimeToDate(Date toConvert, ZoneId zoneId) {
        return Optional.ofNullable(toConvert)
                .map(Date::toInstant)
                .map(instant -> instant.atZone(zoneId))
                .map(LocalDateTime::from)
                .orElse(null);
    }
}
