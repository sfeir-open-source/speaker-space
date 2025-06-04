package com.speakerspace.model.session;

public class Reviews {

    private double average;
    private int positives;
    private int negatives;

    public Reviews(double average, int positives, int negatives) {
        this.average = average;
        this.positives = positives;
        this.negatives = negatives;
    }

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
