package com.smartrent.api.common;

public class DomainException extends RuntimeException {

    private final int status;
    private final String code;

    public DomainException(int status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
