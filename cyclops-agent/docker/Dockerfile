FROM node:18-alpine

# Install ffmpeg (Debian repo)
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# (Optional) Intel VAAPI userspace for hw accel inside container
# RUN apt-get update && apt-get install -y --no-install-recommends vainfo intel-media-va-driver-non-free && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

ENV NODE_ENV=production
CMD ["node", "index.js"]