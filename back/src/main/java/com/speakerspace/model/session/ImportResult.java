package com.speakerspace.model.session;

import java.util.ArrayList;
import java.util.List;

public class ImportResult {
    private int successCount;
    private int totalCount;
    private List<String> errors;

    public ImportResult() {
        this.errors = new ArrayList<>();
    }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public boolean hasErrors() { return !errors.isEmpty(); }
    public int getErrorCount() { return errors.size(); }
}
