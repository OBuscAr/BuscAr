FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# Expose the port (Vite preview usually runs on 4173 by default, but we can configure it)
EXPOSE 4173

# Run the preview server, binding to all network interfaces so Docker can map it
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
