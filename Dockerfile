## APP BUILD ENVIRONMENT ##
FROM node:12-alpine as builder

# Set Working Directory
WORKDIR /usr/src/app

# Add Packages to Build Environment
RUN apk --no-cache --no-progress add \
    git

# Copy Application Source
COPY . .

# Update Build environment
RUN cp -af docker/. src/ \
    && npm i \
    && npm run build

## APP RUN ENVIRONMENT ##
FROM nginx:alpine

# Copy SVELT Static App to Run Environment
COPY --from=builder /usr/src/app/public /usr/share/nginx/html

# PORTS
EXPOSE 80
