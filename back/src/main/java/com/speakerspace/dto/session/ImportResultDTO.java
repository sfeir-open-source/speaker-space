package com.speakerspace.dto.session;

import java.util.ArrayList;
import java.util.List;

public class ImportResultDTO {
    private List<String> successfulImports;
    private List<String> failedImports;
    private int totalCount;
    private int successCount;
    private List<String> errors;

    public ImportResultDTO(List<String> successfulImports, List<String> failedImports) {
        this.successfulImports = successfulImports != null ? successfulImports : new ArrayList<>();
        this.failedImports = failedImports != null ? failedImports : new ArrayList<>();
        this.totalCount = this.successfulImports.size() + this.failedImports.size();
        this.successCount = this.successfulImports.size();
        this.errors = new ArrayList<>();
    }

    public List<String> getSuccessfulImports() {
        return successfulImports;
    }

    public void setSuccessfulImports(List<String> successfulImports) {
        this.successfulImports = successfulImports;
    }

    public List<String> getFailedImports() {
        return failedImports;
    }

    public void setFailedImports(List<String> failedImports) {
        this.failedImports = failedImports;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }
}
