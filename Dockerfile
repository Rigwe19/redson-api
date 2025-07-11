###############################################################################
###############################################################################
##                      _______ _____ ______ _____                           ##
##                     |__   __/ ____|  ____|  __ \                          ##
##                        | | | (___ | |__  | |  | |                         ##
##                        | |  \___ \|  __| | |  | |                         ##
##                        | |  ____) | |____| |__| |                         ##
##                        |_| |_____/|______|_____/                          ##
##                                                                           ##
## description     : Dockerfile for TsED Application                         ##
## author          : TsED team                                               ##
## date            : 2023-12-11                                              ##
## version         : 3.0                                                     ##
##                                                                           ##
###############################################################################
###############################################################################

ARG NODE_VERSION=20.11.0

# ---- Base Node Image ----
FROM node:20-slim as base

# ---- Set Working Directory ----
WORKDIR /opt

# ---- Install System Dependencies ----
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ---- Install App Dependencies ----
COPY package.json package-lock.json* ./
RUN npm install

# ---- Copy Source Files ----
COPY . .

# ---- Build Source Code ----
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-slim as runtime

WORKDIR /opt

COPY --from=base /opt /opt

# ---- Expose Port (adjust if needed) ----
EXPOSE 8081

# ---- PM2 RELATED (commented out) ----
# RUN npm install pm2 -g
# COPY processes.config.cjs .
# CMD ["pm2-runtime", "start", "processes.config.cjs", "--env", "production"]

# ---- Recommended CMD for Render ----
CMD ["node", "dist/index.js"]
