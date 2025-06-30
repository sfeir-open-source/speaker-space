package com.speakerspace.dto.session;

import java.util.ArrayList;
import java.util.List;

public class ImportResultDTO {
    private int successCount;
    private int totalCount;
    private List<String> errors;

    public ImportResultDTO() {
        this.errors = new ArrayList<>();
    }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
