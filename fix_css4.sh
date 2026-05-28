#!/bin/bash
sed -i '' '/body \.admin-trip-form-card \* {/a\
      min-width: 0 !important;
' public/index.html
