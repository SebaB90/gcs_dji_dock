#!/bin/bash
# Script per avviare il backend

cd ~/0_dev/gcs_dji_dock/backend || exit
source venv/bin/activate
cd app || exit
uvicorn main:app --reload --port 8000
