package com.speakerspace.dto.session;

public class ReviewDTO {

    private double average;
    private int positives;
    private int negatives;

    public ReviewDTO() {}

    public double getAverage() {
        return average;
    }

    public void setAverage(double average) {
        this.average = average;
    }

    public int getPositives() {
        return positives;
    }

    public void setPositives(int positives) {
        this.positives = positives;
    }

    public int getNegatives() {
        return negatives;
    }

    public void setNegatives(int negatives) {
        this.negatives = negatives;
    }
}
