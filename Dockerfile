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

# ---- Build Stage ----
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /opt

# Install dependencies
COPY package.json package-lock.json tsconfig.json tsconfig.base.json tsconfig.node.json .barrels.json .swcrc ./
RUN npm ci

# Copy source files
COPY ./src ./src
COPY views ./views
COPY emails ./emails
COPY uploads ./uploads

# Build the app
RUN npm run build
# Optional if you switch to tsc: RUN npx tsc && npx tsc-alias

# ---- Runtime Stage ----
FROM node:${NODE_VERSION}-alpine AS runtime
ENV WORKDIR /opt
WORKDIR $WORKDIR

# Install minimal system packages
RUN apk update && apk add build-base git curl

# PM2 is disabled for Render (commented out)
RUN npm install -g pm2

# Copy built app
COPY --from=build /opt /opt

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy remaining project files
COPY . .

# Expose port
EXPOSE 8081
ENV PORT 8081
ENV NODE_ENV production

# PM2 start (disabled)
CMD ["pm2-runtime", "start", "processes.config.cjs", "--env", "production"]

# Recommended command for Render
# CMD ["node", "dist/index.js"]