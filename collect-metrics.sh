#!/bin/bash
BUILD_TIME=$(date +%s)
echo "{\"build_id\": \"$BUILD_ID\", \"timestamp\": $BUILD_TIME, \"status\": \"success\"}" >> build-metrics.json
