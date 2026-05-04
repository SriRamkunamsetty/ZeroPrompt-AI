FROM node:22-bullseye-slim
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies, including tsx (which is in devDependencies normally) for typescript execution, or we can build the server with esbuild. Since we have package.json we can just npm ci.
RUN npm install
COPY . .

# We only need to run the API on cloud run, not the frontend.
# Setup environment variable to tell server.ts we are in production
ENV NODE_ENV=production
ENV CLOUD_RUN=true

# Expose cloud run port
EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
