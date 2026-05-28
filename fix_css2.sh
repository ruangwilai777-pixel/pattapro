#!/bin/bash
sed -i '' '/\.admin-trip-form-card \.input-premium-compact,/i\
.admin-trip-form-card * {\
  box-sizing: border-box !important;\
}\
.admin-trip-form-card .input-field-premium {\
  min-width: 0 !important;\
}\
.admin-trip-form-card input {\
  min-width: 0 !important;\
}\
.admin-trip-form-card .basket-detail-glass > div {\
  min-width: 0 !important;\
}\
' src/index.css
