#!/usr/bin/env bash
set -euo pipefail
sudo -u postgres psql postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'selleros';" | grep -q 1 || sudo -u postgres createdb selleros
