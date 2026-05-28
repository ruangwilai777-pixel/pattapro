#!/bin/bash
sed -i '' '/body \.admin-trip-form-card \* {/a\
      max-width: 100% !important;
' public/index.html
