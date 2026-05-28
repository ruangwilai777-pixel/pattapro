#!/bin/bash
CSS="
    body .admin-trip-form-card * {
      box-sizing: border-box !important;
    }
    body .admin-trip-form-card .input-field-premium {
      min-width: 0 !important;
    }
    body .admin-trip-form-card input {
      min-width: 0 !important;
      width: 100% !important;
    }
    body .admin-trip-form-card .basket-detail-glass > div {
      min-width: 0 !important;
    }
"

sed -i '' '/body .admin-trip-form-card .input-premium-compact,/i\
    body .admin-trip-form-card * {\
      box-sizing: border-box !important;\
    }\
    body .admin-trip-form-card .input-field-premium {\
      min-width: 0 !important;\
    }\
    body .admin-trip-form-card input {\
      min-width: 0 !important;\
    }\
    body .admin-trip-form-card .basket-detail-glass > div {\
      min-width: 0 !important;\
    }\
' public/index.html
